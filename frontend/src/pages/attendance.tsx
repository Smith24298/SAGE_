import dynamic from 'next/dynamic';

const Attendance = dynamic(
  () => import('@/app/pages/Attendance').then((m) => m.Attendance),
  { ssr: false },
);

export default function AttendancePage() {
  return <Attendance />;
}
