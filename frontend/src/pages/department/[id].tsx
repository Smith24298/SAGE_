import dynamic from "next/dynamic";

const DepartmentProfile = dynamic(
  () => import("@/app/pages/DepartmentProfile").then((m) => m.DepartmentProfile),
  { ssr: false },
);

export default function Page() {
  return <DepartmentProfile />;
}
