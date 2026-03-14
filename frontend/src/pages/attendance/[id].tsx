import dynamic from 'next/dynamic';

const AttendanceDetail = dynamic(
  () => import('@/app/pages/attendance/[id]').then((m) => m.AttendanceDetail),
  { ssr: false },
);

export default function AttendanceDetailPage() {
  return <AttendanceDetail />;
}
