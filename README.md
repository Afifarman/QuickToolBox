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
- `NEXT_PUBLIC_SITE_URL` — **optional**. The canonical public domain, e.g. `https://your-domain.com`.

`NEXT_PUBLIC_SITE_URL` is the single source of truth for canonical tags, Open Graph URLs, `robots.txt` and `sitemap.xml` (see `lib/site-config.js`). When it is not set, the app derives the domain from the deployment itself, in this order:

1. `VERCEL_PROJECT_PRODUCTION_URL` — the production domain of the Vercel project (its custom domain, or its `<project>.vercel.app` alias)
2. `VERCEL_URL` — the URL of the current deployment
3. `https://quick-tool-box-gfr1.vercel.app` — fallback for local builds

So leaving it unset is safe: the generated URLs always match the host that actually serves the site.

### ⚠️ `quick-tool-box-vercel.app` does not exist

`quick-tool-box-vercel.app` and `www.quick-tool-box-vercel.app` are **not registered** — DNS answers with NXDOMAIN, so browsers show "site can't be reached". The domain must never be used as the site URL, and `lib/site-config.js` rejects it even if it is passed through the environment.

If a custom domain is wanted, first register it and point it at the Vercel project (Vercel → Project → Settings → Domains → Add, then create the DNS records Vercel shows), and only afterwards set `NEXT_PUBLIC_SITE_URL` to it. Live hosts today:

- `https://quick-tool-box-gfr1.vercel.app` (current production project)
- `https://quick-tool-box-gamma.vercel.app` (older project, still serving)

Optional AI provider keys. The `/ai` assistant always returns an answer. If one of these is set, that cloud model is used first:

- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`

## Google login (production)

Google OAuth only works if the **app callback URL** is on the Supabase Redirect URLs allowlist. The app always sends users back to `/auth/callback` with **no extra query string**, so the allowlist can match exactly.

In [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration):

1. Set **Site URL** to the live production host:
   `https://quick-tool-box-gfr1.vercel.app`
2. Add these **Redirect URLs**:
   - `https://quick-tool-box-gfr1.vercel.app/auth/callback`
   - `https://quick-tool-box-gfr1.vercel.app/reset-password`
   - `https://quick-tool-box-gamma.vercel.app/auth/callback`
   - `https://quick-tool-box-gamma.vercel.app/reset-password`
   - `https://*-armanarif852-2879s-projects.vercel.app/**`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - your custom domain's `/auth/callback` and `/reset-password`, once that domain is registered and live

In [Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers?provider=Google):

1. Enable Google.
2. Paste the Google Cloud OAuth Client ID and Client Secret.

In Google Cloud → Auth Platform → Clients (Web application):

- Authorized JavaScript origins: `https://quick-tool-box-gfr1.vercel.app`, `https://quick-tool-box-gamma.vercel.app` (and your custom domain once it is live)
- Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (copy this from the Supabase Google provider page)

Without the production `/auth/callback` URL on the Supabase allowlist, Google login silently falls back to Site URL or fails with a redirect error.

## Included
Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator.

## Production deployment
Latest production source is the `main` branch. This line intentionally triggers the connected Vercel deployment after production source fixes.

## Production sync
Production deployment must match the latest `main` commit before release verification.
