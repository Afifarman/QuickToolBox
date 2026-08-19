# QuickToolBox Production

## Deploy
1. Extract this ZIP.
2. Upload the contents to a new GitHub repository.
3. In Vercel, import that repository.
4. Framework preset: Next.js.
5. Build command: `npm run build`.
6. Deploy.

Set these Vercel environment variables (Production + Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new format, starts `sb_publishable_…`; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` still works)
- `NEXT_PUBLIC_SITE_URL` = `https://quick-tool-box-gamma.vercel.app`
- `NEXT_PUBLIC_QTB_PUBLISHABLE_KEY` = publishable API key for QuickToolBox (generate via `npm run generate:key` or `POST /api/publishable-key`)

### Publishable API Keys

QuickToolBox now has its own publishable key system (prefix `qpk_live_` / `qpk_test_`).

- **Generate locally:** `node scripts/generate-publishable-key.mjs` or `npm run generate:key`
- **Generate via API:** `curl -X POST /api/publishable-key -H "Content-Type: application/json" -d '{"env":"live"}'`
- **Manage in UI:** `/dashboard/api-keys` (create, copy, revoke — stored in Supabase in prod, localStorage in demo)
- **Validate:** `GET /api/publishable-key?key=qpk_live_...` or `validatePublishableKey()` in `lib/publishable-key.js`
- **Supabase publishable key:** Create at `Supabase Dashboard → Settings → API → API Keys` → copy `sb_publishable_…` → set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel.

## Google login (production)

Google OAuth only works if the **app callback URL** is on the Supabase Redirect URLs allowlist. The app always sends users back to `/auth/callback` with **no extra query string**, so the allowlist can match exactly.

In [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):

1. Set **Site URL** to the live production host:
   `https://quick-tool-box-gamma.vercel.app`
2. Add these **Redirect URLs**:
   - `https://quick-tool-box-gamma.vercel.app/auth/callback`
   - `https://quick-tool-box-gamma.vercel.app/reset-password`
   - `https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/auth/callback`
   - `https://quick-tool-box-gfr1-armanarif852-2879s-projects.vercel.app/reset-password`
   - `https://*-armanarif852-2879s-projects.vercel.app/**`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`

In [Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers?provider=Google):

1. Enable Google.
2. Paste the Google Cloud OAuth Client ID and Client Secret.

In Google Cloud → Auth Platform → Clients (Web application):

- Authorized JavaScript origins: `https://quick-tool-box-gamma.vercel.app`
- Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (copy this from the Supabase Google provider page)

Without the production `/auth/callback` URL on the Supabase allowlist, Google login silently falls back to Site URL or fails with a redirect error.

## Included
Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator.

## Production deployment
Latest production source is the `main` branch. This line intentionally triggers the connected Vercel deployment after production source fixes.

## Production sync
Production deployment must match the latest `main` commit before release verification.
