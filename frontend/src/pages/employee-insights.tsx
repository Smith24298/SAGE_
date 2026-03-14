import dynamic from "next/dynamic";

const EmployeeInsights = dynamic(
  () =>
    import("@/app/pages/EmployeeInsights").then((m) => m.EmployeeInsights),
  { ssr: false },
);

export default function Page() {
  return <EmployeeInsights />;
}
