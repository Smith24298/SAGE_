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
};

export default nextConfig;
