# OmniRoute server deployment (zero-budget setup)

## Important hosting constraint

QuickToolBox runs on Vercel. Vercel Functions are request-scoped serverless functions and are not a persistent Docker host, so do not try to run the OmniRoute Docker daemon inside the QuickToolBox Vercel project.

OmniRoute is a separate long-running Node/Docker service. A stable public server with persistent storage and HTTPS is required for production use. A provider's free tier may sleep, have resource limits, require a payment method, or change its terms. Do not assume a permanent, always-on, zero-cost public host exists.

The safe zero-budget path is:
1. Use an always-on Linux machine/server that the owner already controls, if available.
2. Run the official OmniRoute Docker self-host deployment there with persistent volume storage.
3. Keep the dashboard private; expose only the authenticated API behind HTTPS.
4. Add the server URL and a dedicated OmniRoute API key to the Vercel **Preview** environment only.
5. Verify a real free-model request and provider fallback in Preview before considering Production.

Official self-host and Docker references:
- https://omniroute.hagicode.com/en-US/getting-started/self-hosting/
- https://github.com/harryweiser/omniroute/blob/main/docs/guides/DOCKER_GUIDE.md

## OmniRoute server hardening

Use the official current self-host instructions and set unique, high-entropy values for all required secrets, including `JWT_SECRET`, `API_KEY_SECRET`, `INITIAL_PASSWORD`, and `OMNIROUTE_WS_BRIDGE_SECRET` where required by the selected image/version.

For a public HTTPS deployment:
- Set `AUTH_COOKIE_SECURE=true`.
- Set `REQUIRE_API_KEY=true`.
- Keep `ALLOW_API_KEY_REVEAL=false`.
- Restrict CORS to the QuickToolBox production/preview origins actually used.
- Persist `/app/data` on a durable volume.
- Do not expose Redis or an unauthenticated dashboard publicly.
- Do not commit secrets to GitHub or put them in `NEXT_PUBLIC_*` variables.

## QuickToolBox Vercel environment

After the gateway is reachable over HTTPS, configure these server-only variables in Vercel Preview:

- `OMNIROUTE_BASE_URL=https://your-private-gateway.example` (or its OpenAI-compatible `/v1` endpoint)
- `OMNIROUTE_API_KEY=<dedicated gateway API key>`
- `OMNIROUTE_MODEL=<explicit free model ID verified in the OmniRoute dashboard>`

Do not set the model to `auto`: it may route to a paid provider. Do not enable paid fallback flags. Do not copy the gateway dashboard password or provider credentials into QuickToolBox.

The integration remains disabled unless all three variables are present. Existing QuickToolBox providers remain as fallback routes. The OmniRoute API key is read only by server-side code.

## Verification checklist

- [ ] Server reports healthy and has persistent storage.
- [ ] HTTPS certificate is valid.
- [ ] API authentication rejects missing/invalid keys.
- [ ] A known free model ID is configured and confirmed free in the provider dashboard.
- [ ] QuickToolBox Preview receives a real response through OmniRoute.
- [ ] A forced gateway failure falls back to the existing configured provider.
- [ ] Logs contain no prompts, API keys, authorization headers, or raw provider error bodies.
- [ ] No Production environment variables or Production deployment are changed without explicit owner approval.
