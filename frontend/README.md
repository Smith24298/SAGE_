# Generate Component

This is a code bundle for Generate Component. The original project is available at https://www.figma.com/design/4wd9C0lGt2eEDz4C0QHC25/Generate-Component.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Environment variables

This app does not hardcode backend URLs. Configure them via env:

- **Recommended (production-like)**: same-origin API calls + Next.js rewrites proxy
  - Set `BACKEND_API_URL` (server-side) in `frontend/.env` or your deployment env
  - Leave `NEXT_PUBLIC_API_URL` empty/unset
- **Direct mode**: browser calls backend directly
  - Set `NEXT_PUBLIC_API_URL` to your backend base URL (e.g. `https://api.example.com`)

See `frontend/.env.local.example` for placeholders.

## Deploying to Vercel

- Configure Firebase via Vercel Environment Variables (`NEXT_PUBLIC_FIREBASE_*`).
- Configure backend routing via `BACKEND_API_URL` (recommended same-origin proxy) or `NEXT_PUBLIC_API_URL` (direct mode).
