# QuickToolBox

## Deploy

1. Import `Afifarman/QuickToolBox` into Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Set the Vercel Project Node.js Version to **22.x**. The repository also pins `engines.node` to `22.x` in `package.json`.
5. Configure the Supabase environment variables below for **Production + Preview + Development**.

### Supabase environment variables

Use the active QuickToolBox Supabase project only:

- Project ref: `cfwjmfaqtsuffemcltyd`
- Project URL: `https://cfwjmfaqtsuffemcltyd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy compatibility fallback; use the anon key from the same project)
- `NEXT_PUBLIC_SITE_URL=https://quicktoolbox-bd.vercel.app`

Do not connect the app to a different or paused Supabase project. Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable.

`NEXT_PUBLIC_SITE_URL` is the canonical origin for metadata, Open Graph URLs, `robots.txt`, and `sitemap.xml` (see `lib/site-config.js`). The OAuth callback helper uses the current browser origin and returns to `/auth/callback`.

## Google login

Google OAuth requires both the app callback URL in Supabase's redirect allowlist and the Supabase callback URL in Google Cloud.

In [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/cfwjmfaqtsuffemcltyd/auth/url-configuration):

1. Set **Site URL** to `https://quicktoolbox-bd.vercel.app`.
2. Add these **Redirect URLs**:
   - `https://quicktoolbox-bd.vercel.app/auth/callback`
   - `https://quicktoolbox-bd.vercel.app/reset-password`
   - `https://*-armanarif852-2879s-projects.vercel.app/**` (Vercel Preview deployments)
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`

In [Authentication → Providers → Google](https://supabase.com/dashboard/project/cfwjmfaqtsuffemcltyd/auth/providers?provider=Google):

1. Confirm Google is enabled.
2. Confirm the Google OAuth Client ID and Client Secret belong to the intended Google Cloud OAuth client.

In Google Cloud → Auth Platform → Clients (Web application):

- Authorized JavaScript origin: `https://quicktoolbox-bd.vercel.app`
- Authorized redirect URI: `https://cfwjmfaqtsuffemcltyd.supabase.co/auth/v1/callback`

The Google provider's client secret must remain in Supabase Auth settings; never add it to browser-visible Vercel variables.

## Canonical domain

The production canonical URL is `https://quicktoolbox-bd.vercel.app`. Do not advertise unregistered domains such as `quick-tool-box-vercel.app` or retired preview aliases as production URLs.

## Included

Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator.

## Production release policy

Make changes on a feature branch and verify the Vercel Preview deployment first. Do not merge to `main` or promote a Production deployment until the release checks have passed and approval is given.
