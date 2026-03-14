import argparse
import copy
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from dotenv import find_dotenv, load_dotenv

from backend.firebase_admin import get_firestore_client


class SeedConfigError(RuntimeError):
    pass


def _load_backend_dotenv() -> None:
    """Load environment variables for CLI usage.

    FastAPI loads env vars in `backend.main`, but this seeder can be run standalone.
    Prefer `backend/.env`, otherwise fall back to any discoverable `.env`.
    """

    backend_env = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(backend_env):
        load_dotenv(dotenv_path=backend_env, override=False)
    else:
        load_dotenv(find_dotenv(usecwd=True), override=False)


def _deepcopy_dict(value: Dict[str, Any]) -> Dict[str, Any]:
    return copy.deepcopy(value)


def load_seed_json(seed_json_path: str) -> Dict[str, Any]:
    if not seed_json_path:
        raise SeedConfigError("seed_json_path is required")

    if not os.path.isfile(seed_json_path):
        raise SeedConfigError(f"Seed JSON not found: {seed_json_path}")

    with open(seed_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for key in ("employee_profiles", "employee_photos", "employee_insights"):
        if key not in data or not isinstance(data[key], dict):
            raise SeedConfigError(
                f"Seed JSON must contain a top-level object '{key}' mapping id->document"
            )

    return data


def _sorted_items_by_numeric_string_id(collection: Dict[str, Any]):
    def _sort_key(item):
        doc_id, _ = item
        try:
            return int(doc_id)
        except Exception:
            return doc_id

    return sorted(collection.items(), key=_sort_key)


def expand_seed(
    seed_data: Dict[str, Any],
    *,
    count: int,
    id_start: int = 1,
) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    if count <= 0:
        raise SeedConfigError("count must be > 0")

    profiles_src = _sorted_items_by_numeric_string_id(seed_data["employee_profiles"])
    photos_src = _sorted_items_by_numeric_string_id(seed_data["employee_photos"])
    insights_src = _sorted_items_by_numeric_string_id(seed_data["employee_insights"])

    if not profiles_src or not photos_src or not insights_src:
        raise SeedConfigError(
            "Seed JSON must include at least one doc in each: employee_profiles, employee_photos, employee_insights"
        )

    profiles: Dict[str, Any] = {}
    photos: Dict[str, Any] = {}
    insights: Dict[str, Any] = {}

    for i in range(count):
        doc_id = str(id_start + i)

        _, profile_tpl = profiles_src[i % len(profiles_src)]
        _, photo_tpl = photos_src[i % len(photos_src)]
        _, insight_tpl = insights_src[i % len(insights_src)]

        profile = _deepcopy_dict(profile_tpl)
        photo = _deepcopy_dict(photo_tpl)
        insight = _deepcopy_dict(insight_tpl)

        # Ensure predictable, unique IDs / fields for list & profile pages.
        profile.setdefault("employeeId", f"EMP-{1000 + id_start + i}")
        profile.setdefault("avatarIndex", (id_start + i) % 8)

        # If template name exists, keep it but disambiguate when count > 1
        if isinstance(profile.get("name"), str) and count > 1:
            profile["name"] = f"{profile['name']} ({doc_id})"

        profiles[doc_id] = profile
        photos[doc_id] = photo
        insights[doc_id] = insight

    return profiles, photos, insights


@dataclass
class SeedResult:
    employees_written: int
    profiles_written: int
    photos_written: int
    insights_written: int


def seed_employees_to_firestore(
    *,
    seed_json_path: str,
    count: int,
    id_start: int = 1,
    merge: bool = True,
    dry_run: bool = False,
) -> SeedResult:
    _load_backend_dotenv()
    seed_data = load_seed_json(seed_json_path)
    profiles, photos, insights = expand_seed(seed_data, count=count, id_start=id_start)

    if dry_run:
        return SeedResult(
            employees_written=count,
            profiles_written=len(profiles),
            photos_written=len(photos),
            insights_written=len(insights),
        )

    db = get_firestore_client()
    if db is None:
        raise SeedConfigError(
            "Firestore not configured. Set FIREBASE_ADMIN_SDK_PATH (or GOOGLE_APPLICATION_CREDENTIALS) to your service account JSON path."
        )

    # Firestore batch limit is 500 ops. We do 3 writes per employee.
    per_batch = 150

    def _doc_ref(coll: str, doc_id: str) -> Any:
        return db.collection(coll).document(doc_id)

    ids = list(profiles.keys())
    written = 0

    for chunk_start in range(0, len(ids), per_batch):
        batch = db.batch()
        chunk_ids = ids[chunk_start : chunk_start + per_batch]

        for doc_id in chunk_ids:
            batch.set(_doc_ref("employee_profiles", doc_id), profiles[doc_id], merge=merge)
            batch.set(_doc_ref("employee_photos", doc_id), photos.get(doc_id, {}), merge=merge)
            batch.set(_doc_ref("employee_insights", doc_id), insights.get(doc_id, {}), merge=merge)

        batch.commit()
        written += len(chunk_ids)

    return SeedResult(
        employees_written=written,
        profiles_written=written,
        photos_written=written,
        insights_written=written,
    )


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed Firestore employee collections")
    parser.add_argument(
        "--seed-json",
        default=os.path.join("frontend", "firestore-seed-employees.example.json"),
        help="Path to a seed JSON with employee_profiles/employee_photos/employee_insights",
    )
    parser.add_argument("--count", type=int, default=25, help="Number of employees to seed")
    parser.add_argument("--id-start", type=int, default=1, help="Starting numeric ID (doc id will be string)")
    parser.add_argument(
        "--no-merge",
        action="store_true",
        help="Overwrite documents (default merges fields)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and expand seed data without writing to Firestore",
    )
    return parser


def main(argv: Optional[list[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)
    result = seed_employees_to_firestore(
        seed_json_path=args.seed_json,
        count=args.count,
        id_start=args.id_start,
        merge=not args.no_merge,
        dry_run=args.dry_run,
    )

    print(
        json.dumps(
            {
                "employees_written": result.employees_written,
                "profiles_written": result.profiles_written,
                "photos_written": result.photos_written,
                "insights_written": result.insights_written,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
