---
name: void-ai
description: Wires AI calls in a Void app - ai.run, ai.stream, ai.image, ai.provider, AI Gateway, provider keys, UsageLimit. Use when adding an AI feature, setting a provider API key, or when AI calls fail in dev or production with an auth, key or 429 error.
---

All calls come from `ai` in `void/ai`. Importing it makes Void bind Workers AI in dev and preview. Lint (`resources` family) checks call shapes and the gateway options argument; this skill covers setup and choices.

## Sign in for development

Workers AI has no local simulator: every dev call runs remotely and spends your account's allowance (or the team platform's limits).

1. Direct Cloudflare project: run `void connect --platform cloudflare`, then `void dev`.
2. Team platform: run `void connect <platform-url>` and link the project. If the platform says AI is disabled, ask its administrator; this also blocks model listing, Markdown conversion and provider-native requests.
3. On an authentication error, run `void cloudflare login` as a user who can reach the account shown by `void cloudflare status`. `wrangler login` does nothing for dev. `CLOUDFLARE_API_TOKEN` wins over the login and is the way in for CI and other automated environments.

Done when one `ai.run` call in dev returns a result instead of an authentication error.

## Call native models

`ai.run(model, inputs)`: model names and input types are typed from `@cloudflare/workers-types`, and inputs must match the model's schema. Models that return binary data (generated images) resolve to a `Blob`, not JSON; return it or read it as a `Blob`. A custom AI binding name (`inference.bindings.ai`) works with `void/ai` on direct Cloudflare deploys only; a managed platform uses its proxy.

AI Gateway options (`skipCache`, `cacheTtl`) go in the third argument: `ai.run(model, inputs, { gateway: { skipCache: true } })`.

Done when the handler returns the result (or the `Blob`) and the type checker accepts the inputs.

## Decide whether a provider key is needed

The docs disagree, so give both to the user and test:

- `guide/ai.md` (Cloudflare Gateway Models): third-party models called through `ai.run` (`google/gemini-2.5-flash`, `openai/gpt-4.1-mini`) use Cloudflare model IDs and Cloudflare-managed credentials. No provider key.
- `integrations/cloudflare.md` (AI on your Cloudflare account): "For provider models, configure your AI Gateway and store the provider key as a Worker secret", with `ai: { gateway: 'my-gateway' }` in `void.config.ts` and `void secret put OPENAI_API_KEY`.

Neither page says which one governs `ai.run('openai/...')` on a direct deployment. The second example is about `ai.provider().fetch()`. Start with no key. Store the key only if the call fails for lack of credentials (this order is an inference, not stated by the docs).

Done when the user has both statements and the call that works in dev is recorded.

## Provider-native requests

`ai.provider('openai').fetch('/chat/completions', { body })` keeps the provider's own HTTP shape and goes through the configured AI Gateway, with your own provider key.

1. Direct deployment: set `ai: { gateway: '<name>' }` in `void.config.ts`.
2. Store the key under the provider's secret name (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, ...). The full table is "Provider keys" in `node_modules/void/docs/reference/api/resources.md`. For another provider, or another secret name, pass `apiKeyEnv`, `apiKeyHeader` and `apiKeyPrefix`.
3. Locally put the key in `.env` (never commit it). For production run `void secret put OPENAI_API_KEY` - [REMOTE] REMOTE STATE: it writes a secret to the deployed project and overwrites any value under that name. Confirm the target with `void cloudflare status` (direct) or the linked project (platform), and run it against production only when the user asked.
4. Team platform: cache, timeout and retry headers (`cf-aig-cache-ttl`, `cf-aig-max-attempts`) apply; logging, metadata and cost headers are ignored. Do not build on them there.

Read [provider-requests.md](provider-requests.md) for custom providers, image generation, multipart bodies, streaming a provider response and aborting.

Done when `ai.provider(...).fetch` returns a 2xx response in dev with the key from `.env`.

## Stream

Return `ai.stream(model, inputs)` directly from the handler; do not await it into `c.json`. A stream that breaks after it starts ends with a `void:error` event, a usage limit with `void:limit`. On the client read it with `fetchStream()` from `void/client`: it throws `UsageLimit` (before or during the stream) or `StreamError`. Catch both to stop the generating state, keep partial output and offer retry. The same holds for provider streams and `ai.run` with `stream: true`.

Done when a forced failure mid-stream leaves the UI out of its generating state with the partial text kept.

## Handle usage limits

Limits reject the promise with `UsageLimit` from `void/limits` (`resource`, `reason`, optional `retryAt`). In route handlers and page actions an uncaught one becomes a structured HTTP 429 with retry information; in queues, cron and other server code it stays a rejected promise.

Catching is optional. To customise, `catch (e) { if (e instanceof UsageLimit) return e.response({ message }); throw e; }`. Keep the user's prompt so they can retry.

Done when every `ai` call in a queue or cron handler either catches `UsageLimit` or is meant to fail the job.
