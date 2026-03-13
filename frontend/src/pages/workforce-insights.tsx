import dynamic from "next/dynamic";

const WorkforceInsights = dynamic(
  () =>
    import("@/app/pages/WorkforceInsights").then((m) => m.WorkforceInsights),
  { ssr: false },
);

export default function Page() {
  return <WorkforceInsights />;
}
