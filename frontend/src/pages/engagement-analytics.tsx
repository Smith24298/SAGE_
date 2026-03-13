import dynamic from "next/dynamic";

const EngagementAnalytics = dynamic(
  () =>
    import("@/app/pages/EngagementAnalytics").then(
      (m) => m.EngagementAnalytics,
    ),
  { ssr: false },
);

export default function Page() {
  return <EngagementAnalytics />;
}
