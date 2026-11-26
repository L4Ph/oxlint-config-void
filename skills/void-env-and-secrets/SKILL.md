---
name: void-env-and-secrets
description: Manages environment variables and secrets in a Void app (env.ts, .env, VITE_* values, void secret, void env check, worker.vars). Use when adding a setting, when a deploy says a required key is missing, when a value works locally but not in production, when a secret must be set, synced, rotated or deleted, or when a framework app needs void/env.
---

Three places hold a setting, each with one job: `env.ts` (checked in) declares name, type, default and requiredness; `.env` (local only, never deployed) holds local values; Worker secrets hold production server values. Shapes of `env.ts` and `void/env` usage are the lint family `env`; this skill holds the production workflow.

## 1. Declare the key in env.ts

```ts
import { defineEnv, string, url } from "void/env";
export default defineEnv({ STRIPE_KEY: string(), VITE_API_ORIGIN: url() });
```

- Helpers: `string()`, `number()`, `boolean()`, `url()`, `email()`, `oneOf([...])`, `json<T>()`, each with `.optional()` and `.default(v)`; any Standard Schema validator works.
- A default is a source-code constant. Use it for non-sensitive fallbacks only, never a credential.
- `env.ts` imports use relative paths or package names; path aliases and imports that need Vite transforms fail.
- Names starting with `__VOID_` are reserved; Void stops with an error if `.env` or `env.ts` defines one.
- A key starting with `VITE_` is a client value (even when a framework changes Vite's `envPrefix`); every other key is a server value.

Done when `void env types` regenerates `.void/env.d.ts` (the file is generated; edit `env.ts` instead) and `env` from `void/env` types the key.

## 2. Set the local value

One root `.env` file. Quote a value that contains `#`: `DATABASE_URL="postgres://user:p#ss@localhost/app"`, because an unquoted `#` starts a comment. Shell values override `.env`. `.env.local`, `.env.production`, `.env.example` and `.dev.vars*` are unsupported; do not create them.

Done when `git check-ignore .env` prints `.env` and `void env check` exits 0.

## 3. Set the production server value (remote)

Every server key in `env.ts` must exist as a Worker secret before `void deploy`; deploy never uploads `.env`.

```sh
void secret put STRIPE_KEY      # masked prompt
```

- Writes to production: it stores an encrypted secret and replaces the value if the name exists. The docs do not say whether the old value is recoverable; treat it as lost.
- Prefer the prompt or stdin (`echo -n "$V" | void secret put NAME`). The inline form `NAME=value` puts the value in shell history.
- Confirm the target first: `void secret list` prints names only (never values) for the saved target. A direct Cloudflare target is the Worker named in `void.config.ts`; a hosted target is the linked project.
- Secret commands validate the value against `env.ts` before upload and reject `VITE_` keys.

Read `secret-commands.md` for `void secret sync`, hosted-project targeting and conflict retries.

Done when `void secret list` shows the name.

## 4. Supply client values

`VITE_*` values are embedded in browser JavaScript and are never secrets. Builds ignore them in `.env`, so a developer's local value cannot become production configuration. Give a production value through the build shell or a schema default:

```sh
VITE_API_ORIGIN=https://api.example.com void deploy
```

Done when `void env check --remote` reports no missing client value in the shell that builds.

## 5. Validate before deploying

`void env check` validates `.env` plus the shell. `void env check --remote` validates build-shell client values and the remote secret names. Both exit non-zero on a missing required key or an invalid readable value. `void deploy` runs the same validation with remote secrets and refuses to upload when a required key is missing, so run `--remote` earlier to fail before a build.

Invalid-value messages hide the value. `VOID_ENV_UNMASK=1` shows it for deliberate local debugging; unset it afterwards.

Done when `void env check --remote` exits 0.

## 6. Decide between secret and worker.vars

`worker.vars` (in `void.config.ts`) holds plain-text string variables. A production build rejects a `worker.vars` name that `env.ts` declares as a server key, and schema-declared server values are never plaintext `vars`. Use `worker.vars` only for non-secret names outside `env.ts`; `.env` overrides it locally only.

If a remote secret has the same name as a `worker.vars` entry, the secret wins. To let the variable apply, remove the secret and redeploy.

DESTRUCTIVE (remote): `void secret delete NAME` removes the production secret from the running Worker immediately and cannot be undone by Void. Confirm first that the name is not a required key in `env.ts` (a missing required key fails validation at Worker startup and at the next deploy), that its value is saved elsewhere if it is still needed, and plan it for a maintenance window.

Done when the name appears in exactly one of `void secret list` and `worker.vars`.

## 7. Reading void/env outside a native Void app

The docs disagree. `integrations/frameworks/overview.md` says TanStack Start, React Router and vinext read validated values from `void/env`, and "for other frameworks, use the framework's environment API". The Nuxt, Analog, SvelteKit and Astro pages each say to declare variables in `env.ts` and read them with `import { env } from "void/env"` (Nuxt: it replaces `useRuntimeConfig()` for env access; Astro: it replaces `astro:env`). `integrations/nodejs-bun-deno.md` says the `void/env` schema and secret workflow requires Cloudflare.

For Nuxt, Analog, SvelteKit or Astro, try `void/env` per the framework page and confirm with a request that reads the key; fall back to the framework's own API if it throws. Astro keeps `VITE_*` for client keys; its `PUBLIC_*` convention affects only direct `import.meta.env`.

Done when a request that reads each key returns it in dev.
