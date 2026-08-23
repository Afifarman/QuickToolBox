# Gemini AI validation checklist

## Configuration

- [ ] `GEMINI_API_KEY` exists only in server-side environment variables.
- [ ] `GEMINI_MODEL` is set intentionally; default is `gemini-3.7-flash`.
- [ ] `GET /api/ai` reports `configured: true` in the target environment.

## API behavior

- [ ] `POST /api/ai` rejects an empty prompt with HTTP 400.
- [ ] A configured request returns `text/event-stream`.
- [ ] The stream contains a provider/status event.
- [ ] The stream contains at least one Gemini `step.delta` event with `delta.type = text`.
- [ ] The stream ends with the completion status event.
- [ ] Invalid provider responses are surfaced as a safe error without exposing the API key.

## URL Context

- [ ] Send a prompt containing a public URL and ask Gemini to summarize it.
- [ ] Read the complete stream and confirm the UI displays progressive output.
- [ ] When Gemini invokes URL Context, confirm a non-model step/progress event is received.

## Frontend

- [ ] `/ai` connects to `/api/ai` using a POST request.
- [ ] Text appears incrementally while Gemini is generating.
- [ ] Progress status changes while tool/context steps run.
- [ ] Errors are visible and actionable.
- [ ] Clear resets prompt, answer, status and error state.
- [ ] Ctrl/Cmd+Enter submits the prompt.

## Release gate

- [ ] `npm run build` passes.
- [ ] End-to-end streamed POST is tested against a server process that can reach the Gemini API.
- [ ] Production is not updated directly from this feature branch.
- [ ] Merge only after the repository's required checks pass and an approval is recorded.
