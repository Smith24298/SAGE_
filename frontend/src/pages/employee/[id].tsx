import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const EmployeeProfile = dynamic(
  () => import("@/app/pages/EmployeeProfile").then((m) => m.EmployeeProfile),
  { ssr: false },
);

export default function Page() {
  const router = useRouter();
  const id = router.query.id ? Number(router.query.id) : 1;
  return <EmployeeProfile employeeId={id} />;
}
