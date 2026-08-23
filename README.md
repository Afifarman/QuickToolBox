# QuickToolBox Production

QuickToolBox is a Next.js utility site with an AI assistant, CV tools and student tools.

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `GEMINI_API_KEY` to a server-side Gemini API key.
5. Optionally set `GEMINI_MODEL` (default: `gemini-3.7-flash`) and `GEMINI_THINKING_LEVEL` (default: `high`).
6. Run `npm run dev` and open `/ai`.

The Gemini key must never be prefixed with `NEXT_PUBLIC_` because it is a server credential.

## Gemini AI

The `/ai` page calls `POST /api/ai`. The Next.js route proxies Gemini's Interactions API as an SSE stream, so the browser receives progressive model deltas instead of waiting for a complete response. The server also enables Gemini URL Context for prompts that ask it to inspect a URL.

The implementation is split into:

- `app/ai/page.js` — frontend chat UI and SSE reader.
- `app/api/ai/route.js` — server route, validation, streaming proxy and error handling.
- `lib/gemini.js` — Gemini API configuration and server-side stream creation.
- `.env.example` — environment variable template.

## Production safety

AI changes should go through a feature branch → pull request → successful build/checks → approval → production. Do not place `GEMINI_API_KEY` in source control.

## Validation

Before production, verify:

- `GET /api/ai` reports `configured: true` in the intended environment.
- `POST /api/ai` with a real prompt returns `text/event-stream`.
- The stream contains at least one Gemini `step.delta` text event.
- A URL-context prompt produces a tool/context progress event when Gemini chooses to use the URL Context tool.
- Browser UI shows text progressively while the request is running.
- Missing/invalid keys produce a clear error without exposing secrets.
- Build completes with `npm run build`.

## Included tools

Age Calculator, Date Calculator, Currency Converter, Unit Converter, PDF Tools, Word Counter, Password Generator, QR Code Generator, Image Compressor, Percentage Calculator, AI Assistant and student utilities.
