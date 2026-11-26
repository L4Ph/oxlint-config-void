# Provider-native request variants

Read this when `ai.provider()` needs more than a chat call: a provider outside Void's key map, images, multipart bodies, provider streaming, or cancelling.

## Custom providers

A provider missing from Void's key map needs its secret name and header:

```ts
ai.provider('custom-provider', {
  apiKeyEnv: 'CUSTOM_PROVIDER_API_KEY',
  apiKeyHeader: 'x-api-key',
  apiKeyPrefix: '',
}).fetch('/v1/respond', { body: { prompt: 'Hello' } });
```

Defaults: OpenAI-style providers send `Authorization: Bearer <key>`; Google AI Studio sends `x-goog-api-key`.

## Image generation

- Cloudflare-native models: `ai.image('@cf/black-forest-labs/flux-1-schnell', { prompt })` or `ai.run`. The result is a `Blob`.
- Provider-native: `ai.provider('openai').fetch('/images/generations', { body })`. The body follows the provider's own request schema, not Void's.

## Multipart bodies

Pass a `FormData` as `body` (`/images/edits` with a `Blob` field named `image`). Build it from `await c.req.parseBody()`.

## Streaming a provider response

Return the provider response from the handler and set `stream: true` in the request body.

## Aborting

Pass `signal` (for example `AbortSignal.timeout(30_000)`) to cancel a request or stop reading its stream. Reading an aborted stream rejects with the signal's reason; it does not end with a `void:error` event. Wrap the read in a `try` and treat the rejection as the end.
