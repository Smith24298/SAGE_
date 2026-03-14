import dynamic from "next/dynamic";

const Events = dynamic(
  () => import("@/app/pages/Events").then((m) => m.Events),
  { ssr: false }
);

export default function Page() {
  return <Events />;
}
