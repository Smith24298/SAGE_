import dynamic from "next/dynamic";

const Documents = dynamic(
  () => import("@/app/pages/Documents").then((m) => m.Documents),
  { ssr: false },
);

export default function Page() {
  return <Documents />;
}
