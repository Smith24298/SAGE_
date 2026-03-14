import dynamic from "next/dynamic";

const PastEvents = dynamic(
  () => import("@/app/pages/PastEvents").then((m) => m.PastEvents),
  { ssr: false }
);

export default function Page() {
  return <PastEvents />;
}
