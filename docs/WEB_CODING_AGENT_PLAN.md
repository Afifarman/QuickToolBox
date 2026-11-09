# QuickToolBox Web Coding Agent — zero-budget implementation plan

## Decision

Use **OpenHands Agent Canvas** as the open-source coding-agent runtime, with a QuickToolBox-native dashboard at `/coding-agent`. Use **Ollama + a small local code model** for zero-cost inference where local hardware permits it. The dashboard and marketing/site UI remain on Vercel; the agent runtime does not.

Why OpenHands:
- It provides a browser-based control center and an Agent Server API.
- It can run locally or on an owner-controlled machine and supports multiple agent backends.
- It is open source and model-agnostic.
- Its own documentation warns that running without a sandbox gives the agent full access to the host filesystem. We must not silently enable that mode.

Official references:
- https://github.com/OpenHands/OpenHands
- https://docs.openhands.dev/
- https://ollama.com/
- https://github.com/ollama/ollama

## $0 reality check

The website hosting and agent software can be free, but model inference and persistent compute are not magically unlimited. A dependable, always-on public coding-agent server cannot be promised at $0. The initial supported mode is an owner-controlled local runtime. The browser dashboard is hosted by QuickToolBox, while the agent process runs on the user's own machine.

Do not use Vercel Functions as a Docker host or long-running agent worker. Do not route to a model named `auto` if it can select paid providers. Do not silently fall back to templates or paid APIs.

## Target architecture

```text
QuickToolBox /coding-agent (Vercel, UI only)
                 |
        authenticated connection
                 |
OpenHands Agent Server (owner-controlled PC / server)
                 |
        isolated workspace runtime
                 |
Ollama (local inference) -> local coding model
                 |
        isolated feature branch
                 |
GitHub Pull Request -> CI + Vercel Preview
                 |
         owner approval required
```

The browser-facing dashboard must never receive GitHub tokens, provider keys, or agent-server secrets in public client-side variables. Any remote connection must use an authenticated server-side adapter or a secure local pairing flow. Do not expose an unauthenticated Agent Server to the public internet.

## Delivery phases

### Phase 1 — Website foundation (this PR)
- Add a dedicated responsive `/coding-agent` page.
- Explain the chosen runtime, local model path, honest connection state, and guarded workflow.
- Add setup and security documentation.
- Do not claim that the agent is connected or can already edit repositories.
- No new paid dependencies, API keys, or production environment changes.

### Phase 2 — Local runtime pairing
- Install and validate OpenHands Agent Canvas on the owner's Windows machine.
- Verify prerequisites and sandbox availability before allowing repository access.
- Because Docker virtualization was previously reported disabled, first check BIOS/Windows virtualization and Docker health. Do not bypass sandbox isolation by default.
- Start with a disposable test repository, not QuickToolBox.
- Verify Ollama health and a real local-model response. Start with a quantized 3B-class coding model; benchmark before attempting larger models on 16 GB RAM.

### Phase 3 — Secure website connection
- Add a server-side connection adapter with strict origin, authentication, request-size, timeout, and rate-limit controls.
- Store credentials only in server-side environment variables or a protected pairing store; never in `NEXT_PUBLIC_*`, browser localStorage, logs, or Git.
- Add connection health checks and explicit disconnect/revoke controls.
- Keep the agent server private. For remote access, use a private authenticated tunnel; never expose an open port.

### Phase 4 — GitHub coding workflow
- Read-only repository inspection first.
- Create a new feature branch for every task.
- Permit only scoped file changes on that branch.
- Run formatting, unit tests, build, dependency/security checks.
- Open a draft PR and wait for Preview checks.
- Never merge, push to `main`, or deploy Production without explicit user approval.

### Phase 5 — Preview validation and rollout decision
- Verify UI on mobile and desktop.
- Verify real model responses, cancellation, timeout, and unavailable-runtime errors.
- Verify unauthorized requests are rejected and secrets do not appear in logs or browser payloads.
- Review GitHub Actions and Vercel Preview results.
- Keep the PR open until the owner approves the next step.

## Non-negotiable safety rules

1. No direct writes to `main`.
2. No automatic PR merge or auto-merge.
3. No Production deployment or Production environment-variable changes.
4. No paid API provider, paid fallback, or paid hosting.
5. No arbitrary shell command execution from the public Vercel app.
6. No agent access to the full host filesystem by default.
7. Show truthful states: disconnected, connecting, connected, busy, failed, and completed.
8. Every claimed code change must have a Git diff and test evidence.

## Acceptance criteria

- `/coding-agent` explains the architecture and does not misrepresent an unconfigured runtime as connected.
- No secrets are exposed to client bundles.
- No Production or `main` changes are made.
- CI build and unit tests pass on the feature branch.
- A later runtime-integration PR must prove sandbox isolation and a real local-model response before enabling code execution.
