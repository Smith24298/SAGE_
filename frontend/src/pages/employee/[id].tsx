import dynamic from 'next/dynamic';

const EmployeeProfile = dynamic(
  () => import('@/app/pages/EmployeeProfile').then((m) => m.EmployeeProfile),
  { ssr: false }
);

export default function Page() {
  return <EmployeeProfile />;
}
