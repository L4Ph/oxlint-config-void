# Auth rate limits and the trusted key

Deployed Cloudflare apps limit auth requests per client IP with Better Auth's defaults (for example 3 sign-in attempts per 10 seconds). Each Worker instance keeps its own count. Everything here goes in `auth.ts`.

## Change the limits

Set `rateLimit` to change or turn them off. To share one count across instances set `rateLimit: { storage: 'database' }`, then run `void db generate` for a direct Cloudflare deploy; review and commit the SQL.

Done when `void db generate` wrote a new migration file and it is committed.

## Let a trusted caller past the limits

Two setups share one IP and hit the limits: a server that calls your auth endpoints for its users (backend-for-frontend, a Vercel or nginx rewrite, another Worker) and end-to-end tests against a deployed app. `x-forwarded-for` is client-controlled, so a secret header identifies the trusted caller instead:

```ts
import { defineAuth } from "void/auth";

export default defineAuth(({ defaults, env }) => ({
  ...defaults,
  rateLimit: {
    customRules: {
      "/**": (request, rule) =>
        env.AUTH_TRUSTED_KEY && request.headers.get("x-auth-trusted-key") === env.AUTH_TRUSTED_KEY
          ? false
          : rule,
    },
  },
}));
```

`'/**'` matches every auth endpoint; `false` skips the limit, `rule` keeps the default. Declare `AUTH_TRUSTED_KEY: string().optional()` in `env.ts` and set it with `void secret put AUTH_TRUSTED_KEY` (a remote write: it stores a Worker secret; confirm the target with `void secret list` first).

Done when a request with the header passes repeatedly and one without it is still limited.

## Rules for the key holder

- A proxy holding the key rate-limits every auth request it forwards, per user: sign-up, password reset and verification emails included.
- A test runner sends the key only to your app.
- The key stays out of code that runs in browsers.
