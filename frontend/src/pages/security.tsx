import dynamic from "next/dynamic";

const Migrations = dynamic(
  () => import("@/app/pages/Security").then((m) => m.Migrations),
  { ssr: false },
);

export default function Page() {
  return <Migrations />;
}
