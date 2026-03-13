import type { AppProps } from "next/app";

import "@/styles/index.css";

import { Layout } from "@/app/components/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
