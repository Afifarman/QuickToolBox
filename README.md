# QuickToolBox

A free online toolbox: 28 utility tools, 24 student tools, an AI assistant and a 120-template CV maker. Built with Next.js (App Router) and React.

## Deploy

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Framework preset: **Next.js**. Build command: `npm run build`.
4. Deploy.

### ⚠️ Make the deployment public

If visitors see a Vercel login screen instead of the site, **Deployment Protection** is switched on.
Turn it off in **Vercel → Project → Settings → Deployment Protection → Vercel Authentication → Disabled**, then redeploy.
This is the single most common reason a working build appears "not working" in the browser.

## Environment variables

Everything runs without configuration — all 52 tools and the CV maker work with **no environment variables at all**.
The two optional integrations below stay disabled (with a friendly in-app message) until you add their keys:

| Variable | Enables | Required? |
| --- | --- | --- |
| `OPENAI_API_KEY` | `/ai` assistant and the AI Study Assistant | Optional |
| `OPENAI_MODEL` | Override the model (default `gpt-4o-mini`) | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Login, register, profile, password reset | Optional |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same as above (`NEXT_PUBLIC_SUPABASE_ANON_KEY` also accepted) | Optional |

Without Supabase, the auth pages explain that accounts are unavailable and point users to the tools, which never require an account.
Without an OpenAI key, `/api/ai` returns a clear 503 message instead of failing silently.

## Local development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Included tools

**Utility (28):** PDF Merge, PDF Split, PDF Compressor, Image → PDF, Passport Photo Maker, GPA/CGPA Calculator, EMI Calculator, Salary Calculator, Tax/VAT Calculator, Invoice Generator, Cover Letter Builder, QR Generator, QR Scanner, URL Shortener, JSON Formatter, Favicon Generator, Meta Tag Generator, Sitemap Generator, Password Strength Checker, Password Generator, World Clock, Image Compressor, Age Calculator, Date Calculator, Unit Converter, Currency Converter, Word Counter, Percentage Calculator.

**Student (24):** GPA/CGPA & grade calculators, assignment planner and checklist, study timetable, Pomodoro timer, study time calculator, scientific calculator, math solver, citation generator, essay outline generator, flashcards, quiz generator, notes summarizer, grammar checker, translator, PDF notes extractor, semester result calculator, exam countdown, budget calculator, notes organizer, notes QR generator, word/character counter, AI study assistant.

**Other:** AI Assistant (`/ai`), CV Maker with 120 templates (`/cv-maker`).

The tool catalog lives in `lib/tools.js` and is the single source of truth for the home page, the `/tools` index and the dynamic tool routes, so listings can never drift out of sync with the router.

## Privacy

File tools (PDF, image, favicon, passport photo) run entirely in the browser — files are never uploaded. Favorites, history, saved results and settings are stored in `localStorage` on your device.
