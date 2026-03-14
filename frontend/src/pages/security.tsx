import dynamic from "next/dynamic";

const Security = dynamic(
  () => import("@/app/pages/Security").then((m) => m.Security),
  { ssr: false },
);

export default function Page() {
  return <Security />;
}
