import dynamic from "next/dynamic";

const AIInsights = dynamic(
  () => import("@/app/pages/AIInsights").then((m) => m.AIInsights),
  { ssr: false },
);

export default function Page() {
  return <AIInsights />;
}
