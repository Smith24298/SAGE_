import dynamic from 'next/dynamic';

const Employees = dynamic(
  () => import('@/app/pages/Employees').then((m) => m.Employees),
  { ssr: false }
);

export default function Page() {
  return <Employees />;
}
