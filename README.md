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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `NEXT_PUBLIC_SITE_URL` = `https://quick-tool-box-gamma.vercel.app`

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

## Security architecture

### Auth flow (PKCE)
The app uses the **PKCE (Proof Key for Code Exchange)** OAuth flow — the most secure OAuth 2.0 authorisation flow for public clients. A cryptographic challenge is generated before the redirect, and the browser must present the matching verifier when exchanging the code for a session. This prevents interception attacks even without a client secret.

1. User clicks **Continue with Google**.
2. PKCE code verifier is stored in a cookie by `@supabase/ssr`.
3. User authorises in Google.
4. Google redirects to `https://<project>.supabase.co/auth/v1/callback`.
5. Supabase validates the code verifier and redirects to `/auth/callback?code=<session_code>`.
6. The callback route exchanges the code for session cookies.
7. A **middleware** (`middleware.js`) refreshes the session on every navigated request, preventing silent expiration.

### Middleware
`middleware.js` runs on every request:

- Refreshes the Supabase auth session, extending cookie lifetime.
- Protects authenticated routes (`/dashboard`, `/profile`, `/favorites`, `/history`, `/saved`, `/settings`) — unauthenticated users are redirected to `/login`.
- Sets secure cookie defaults (`SameSite=Lax`, `Secure` in production).

### Safe redirects
- The `safeNextPath()` helper prevents open-redirect attacks by only allowing same-origin paths.
- The `getRequestOrigin()` function correctly resolves the origin behind Vercel's reverse proxy headers (`x-forwarded-host`, `x-forwarded-proto`).

## Included
Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator.

## Production deployment
Latest production source is the `main` branch. This line intentionally triggers the connected Vercel deployment after production source fixes.

## Production sync
Production deployment must match the latest `main` commit before release verification.