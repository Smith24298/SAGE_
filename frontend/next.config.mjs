import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function normalizeBackendUrl(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // If NEXT_PUBLIC_API_URL is unset, the client uses same-origin requests.
    // This rewrite proxies those requests to the backend URL configured on the server.
    const backend = normalizeBackendUrl(process.env.BACKEND_API_URL);
    if (!backend) return [];

    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/chat", destination: `${backend}/chat` },
      { source: "/health", destination: `${backend}/health` },
      {
        source: "/upload_transcript",
        destination: `${backend}/upload_transcript`,
      },
    ];
  },
  env: (() => {
    const path = process.env.FIREBASE_CONFIG_PATH;
    if (!path) return {};
    const abs = path.startsWith("/") ? path : resolve(process.cwd(), path);
    if (!existsSync(abs)) return {};
    try {
      const data = JSON.parse(readFileSync(abs, "utf8"));
      return {
        NEXT_PUBLIC_FIREBASE_API_KEY:
          data.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
          data.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID:
          data.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
          data.storageBucket ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
          data.messagingSenderId ??
          process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID:
          data.appId ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
    } catch {
      return {};
    }
  })(),
};

export default nextConfig;
