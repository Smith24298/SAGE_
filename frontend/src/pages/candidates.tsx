import dynamic from 'next/dynamic';

const Candidates = dynamic(
  () => import('@/app/pages/Candidates').then((m) => m.Candidates),
  { ssr: false },
);

export default function Page() {
  return <Candidates />;
}
