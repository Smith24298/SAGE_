import dynamic from 'next/dynamic';

const MeetingIntelligence = dynamic(
  () => import('@/app/pages/MeetingIntelligence').then((m) => m.MeetingIntelligence),
  { ssr: false }
);

export default function Page() {
  return <MeetingIntelligence />;
}
