---
name: void-meta-framework-basics
description: "Connects a meta-framework app (TanStack Start, React Router, SvelteKit, Nuxt, Analog, Astro, vinext) to Void; the shared steps every framework skill builds on. Use first when package.json holds one of these frameworks, before the framework's own skill; also for env, bindings, caching or Cloudflare settings in a framework app."
---

# Void in a meta-framework app

The framework keeps routing and rendering. Void adds databases, storage, jobs, env validation and deploy. Void reads `package.json` dependencies to detect the framework. Docs: `node_modules/void/docs/integrations/frameworks/overview.md`.

After this skill, open the framework's skill: `void-tanstack-start`, `void-react-router`, `void-sveltekit`, `void-nuxt`, `void-analog`, `void-astro`. vinext has no page of its own in the docs and is named "experimental" in `integrations/cloudflare.md`; use this skill alone for it.

## Wire the Cloudflare runtime

1. Add `voidPlugin()` from `void` to the framework's Vite config (Nuxt: `vite.plugins`; Astro: `vite.plugins`).
2. Pick the runtime path by framework:
   - TanStack Start, React Router: Void provides the Cloudflare Vite plugin. Add no Cloudflare adapter.
   - SvelteKit, Nuxt, Analog, Astro: keep the framework's own Cloudflare adapter and point its dev runtime at Void's generated `./.void-wrangler.jsonc`. The framework skill shows the option name.
3. Put Cloudflare settings in `void.config.ts` (see the next section). Void merges them with inferred bindings and records provisioned IDs in `void.lock.json`; commit both files.

Done when the framework's Cloudflare option names `./.void-wrangler.jsonc` (or the framework is TanStack Start / React Router) and `void prepare` exits 0.

Plugin order is a docs inconsistency, see [Where the docs disagree](#where-the-docs-disagree). Lint: family `frameworks` (`void-wrangler-config-path`, `void-plugin-before-framework-plugin`).

## Set the Cloudflare settings

`compatibility_date` and `compatibility_flags` live under `worker` in `reference/config.md` and `integrations/cloudflare.md`, and under `cloudflare` in every framework example. `cloudflare.md` says "the `worker` field takes precedence for compatibility settings and variables". Use one location per app; where both are set, `worker` wins. Bindings, `name`, routes and service bindings go under `cloudflare`.

Flags per framework: Analog and Nuxt need `nodejs_compat` and `nodejs_als`; Astro needs `nodejs_als`; the SvelteKit example sets `nodejs_compat`.

Done when the compatibility settings appear in exactly one of `worker` or `cloudflare`.

## Read environment values

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. A read of a missing or invalid value throws; only requests that perform the read fail, other requests still run. Client-exposed keys are `VITE_*`.

The docs disagree about which frameworks this covers, see [Where the docs disagree](#where-the-docs-disagree).

Done when every server-side read of a declared key goes through one mechanism, and a request that reads a deliberately missing key fails while an unrelated route answers.

## Reach raw bindings

Use the framework's own mechanism, and keep `void/env` for env values:

| Framework | Raw bindings |
| --- | --- |
| TanStack Start, React Router, SvelteKit 3, Astro | `import { env } from "cloudflare:workers"` |
| Analog | `cloudflare:workers` or the H3 event context |
| SvelteKit 2 | `platform.env` |
| Nuxt | `event.context.cloudflare.env` |

`void/db`, `void/kv`, `void/storage`, `void/ai` work from server-side code in every framework; use them there only.

Done when no `void/*` helper import is reachable from browser code (lint: `tanstack-void-in-server-fn`, `react-router-void-in-loaders-only`, `sveltekit-no-void-in-client`, `nuxt-no-void-in-client`, `analog-void-import-server-only`).

## Configure caching and routing

Framework apps set revalidation and prerendering in `void.config.ts` (`routing.revalidate`, `routing.prerender`); per-page `.server.ts` exports exist only for Void apps. Void caches public HTML documents on both `void deploy` and `void deploy --platform cloudflare`; framework data requests keep the framework's behavior.

- A response with `Set-Cookie`, or `Cache-Control: private`, `no-store` or `no-cache`, is never shared. Remove them from HTML you want cached.
- SvelteKit, Nuxt, Analog and Astro ignore `routing.notFound` (they pin `not_found_handling` to `"none"`); `void deploy` warns if it is set. Delete it from those apps.
- vinext: `middleware.ts` and `proxy.ts` also apply to files in `public/`; with either file present, static requests go through the Worker and count as Worker requests.

Done when public HTML routes you want cached send none of those headers, and `routing.notFound` is absent in the four frameworks above.

## Auth

Void-managed auth (`void/auth`, `auth.ts`) is not supported in framework mode. Use the framework's Better Auth integration (lint: `no-void-auth-in-framework-apps`).

## Develop locally

Local D1, KV and R2 use placeholder IDs until deploy. Importing `void/ai` adds a remote Workers AI binding in development and needs a Cloudflare login (`void auth login` selects the saved destination; `--platform cloudflare` in non-interactive shells).

Done when the dev server starts and a route that reads each resource you use answers.

## Deploy

`void deploy` builds with the framework and publishes. It changes remote state: it provisions resources, applies pending migrations to the remote database, and publishes the Worker or deployment; `--skip-migrations` skips the SQL step only. Confirm before running: the platform in `.void/project.json` (or the `--platform` you pass) is the one you mean, migrations are reviewed and committed, and the user asked for this deploy. Rollback is `void project rollback`; check the earlier code works with the current schema first. Drizzle drift stops the deploy and tells you to run `void db generate`, review, commit, and rerun.

Done when `void project status` shows the deployment you started.

## Where the docs disagree

Give both statements to the user and check which holds in this app.

- **Env via `void/env`.** `overview.md` ("Environment variables", line 53): TanStack Start, React Router and vinext import `env` from `void/env`; "for other frameworks, use the framework's environment API". The SvelteKit, Nuxt, Analog and Astro pages each tell the reader to declare keys in `env.ts` and read `void/env`, and say it replaces `useRuntimeConfig()` (Nuxt), `astro:env` (Astro) or the H3 event context (Analog). Try `void/env` first as the framework page directs; if the import fails in that framework, use the framework's own API.
- **Plugin order.** TanStack Start and React Router: "must come before the framework plugin". The Analog example lists `voidPlugin()` after `analog()`; the SvelteKit example lists it first; no page states a rule for those two. The lint rule `void-plugin-before-framework-plugin` covers React Router and TanStack Start only.
- **Compatibility settings home.** `worker` versus `cloudflare`, above.

Norms map: `norms.json`.
