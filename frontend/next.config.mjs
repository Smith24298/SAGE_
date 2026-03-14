import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: (() => {
    const path = process.env.FIREBASE_CONFIG_PATH;
    if (!path) return {};
    const abs = path.startsWith('/') ? path : resolve(process.cwd(), path);
    if (!existsSync(abs)) return {};
    try {
      const data = JSON.parse(readFileSync(abs, 'utf8'));
      return {
        NEXT_PUBLIC_FIREBASE_API_KEY: data.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: data.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: data.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: data.storageBucket ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: data.messagingSenderId ?? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: data.appId ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
    } catch {
      return {};
    }
  })(),
};

export default nextConfig;
