# QuickToolBox Production

## Deploy
1. Extract this ZIP.
2. Upload the contents to a new GitHub repository.
3. In Vercel, import that repository.
4. Framework preset: Next.js.
5. Build command: `npm run build`.
6. Deploy.

The `app` directory is at the project root. All tools work without environment variables; the AI Assistant (`/ai`) and authentication are optional and need them:

| Variable | Where | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Vercel Environment Variables / `.env.local` | Powers the AI Assistant (`/ai`, `/api/ai`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel Environment Variables / `.env.local` | Optional Supabase auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel Environment Variables / `.env.local` | Optional Supabase auth |

For local development, copy `.env.example` to `.env.local` and fill in your values. `.env.local` is gitignored and never committed.

## Included
Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator.

## Production deployment
Latest production source is the `main` branch. This line intentionally triggers the connected Vercel deployment after production source fixes.

## Production sync
Production deployment must match the latest `main` commit before release verification.
