import dynamic from "next/dynamic";

const Departments = dynamic(
  () => import("@/app/pages/Departments").then((m) => m.Departments),
  { ssr: false },
);

export default function Page() {
  return <Departments />;
}
