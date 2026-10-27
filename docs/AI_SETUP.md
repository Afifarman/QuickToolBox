# QuickToolBox AI setup and verification

## Environment variables

Add `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables.

- Preview: add it to Preview deployments.
- Production: keep the existing Production value unchanged until Preview has been verified.
- For this branch, the Preview variable may be scoped to `fix/ai-provider-end-to-end`.
- Keep the key secret. Do not use a `NEXT_PUBLIC_` prefix and never paste the key into source code, logs, screenshots, or commits.

Optional: set `GEMINI_MODEL` to a model ID available to your Google AI Studio key. If unset, the API tries `gemini-2.5-flash` and then `gemini-2.5-flash-lite`.

## Test in Preview

1. Open `/api/ai`. The JSON reports configured provider booleans only; it never returns secret values.
2. Submit a prompt in `/ai`.
3. Check the result source label. `Gemini` means the API returned a Gemini response; `On-device assistant` means the local fallback was used.
4. If a fallback warning appears, inspect Vercel Runtime Logs for `[AI] Gemini request failed` and note the status code and sanitized message. Do not share secret values.

## Safe rollout

Do not merge this branch or promote it to Production until the Preview build succeeds and a real Gemini response has been confirmed. Environment variable changes require a fresh deployment.
