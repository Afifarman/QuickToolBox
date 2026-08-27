# QuickToolBox AI Auto-Fix

## Flow

`Detect → Diagnose → Fix branch → Test → Vercel Preview → PR → Approval → Production`

The agent is intentionally unable to deploy directly to production. It can inspect repository files and produce a structured diagnosis. Future repair tools should remain branch-scoped and require successful validation before PR creation.

## Environment

Set these only on the server/CI side:

- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `GITHUB_REPO_OWNER=Afifarman`
- `GITHUB_REPO_NAME=QuickToolBox`
- `GITHUB_BASE_REF=main`

Never expose secrets to browser code or commit them to the repository.

## Local run

```bash
npm install
npm run dev
```

Open `/admin/auto-fix` and submit a real error message.

## Validation checklist

- [ ] `/api/auto-fix` returns an SSE stream.
- [ ] At least one `tool` progress event is emitted.
- [ ] At least one `delta` model text event is emitted.
- [ ] The final `done` event reports `toolSeen=true` and `textSeen=true`.
- [ ] Missing `OPENAI_API_KEY` returns a clear 503 response.
- [ ] No production/main write is exposed by the agent route.
- [ ] Repository inspection is read-only.
- [ ] Any future code-writing tool must be restricted to an auto-fix branch and followed by build/test validation.
