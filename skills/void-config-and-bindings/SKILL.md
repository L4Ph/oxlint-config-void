---
name: void-config-and-bindings
description: Edits void.config.ts and Cloudflare bindings in a Void app. Use when adding, renaming or typing a binding, choosing between the worker and cloudflare keys (compatibility_date, vars, limits), moving off wrangler.jsonc, or deciding what to commit (void.lock.json, .void-wrangler.jsonc).
---

All Worker settings live in `void.config.ts`; Void generates the Cloudflare config from it. Config key shapes are the lint family `config`; this skill holds which setting goes where and what to commit.

## 1. Write settings as TypeScript in defineConfig

```ts
import { defineConfig } from "void/config";
export default defineConfig({ worker: { compatibility_flags: ["nodejs_compat"] } });
```

The docs show fields as JSON fragments; place each inside `defineConfig({ ... })`. Nothing is required: omit what inference or `void init` already settles.

Done when `void prepare` loads the config without error.

## 2. Choose `worker` or `cloudflare`

- `worker`: `compatibility_date`, `compatibility_flags`, `vars` (string values), `limits`.
- `cloudflare`: everything else the Cloudflare config takes: `name`, `account_id`, binding arrays (`d1_databases`, `kv_namespaces`, `r2_buckets`), routes, services, migrations. Void passes these through, and they win over what Void recorded earlier in `void.lock.json`.

The docs disagree on `compatibility_date`. `reference/config.md` and `integrations/cloudflare.md` put it under `worker` (examples `2025-12-01` and `2026-02-24`; `void init` pins it there). The Nuxt, Analog, Astro, SvelteKit and framework-overview pages put `compatibility_date: '2026-02-24'` and the flags under `cloudflare`. `integrations/cloudflare.md` adds that `worker` takes precedence for compatibility settings and variables. In the installed Void 1.11.0, the code that resolves the date reads `worker.compatibility_date` first (checked by reading `dist/`, not by running a deploy). Put it under `worker` and set it in one place only.

`worker.limits.cpu_ms` (1 to 300000) must stay within the plan: Workers Free allows 10 ms. On a Void platform, deploy fails above the plan ceiling; lower it and retry. On a direct deploy Cloudflare enforces it.

Done when the date and flags appear in exactly one of `worker` and `cloudflare`.

## 3. Move off wrangler.jsonc

Settings from a root `wrangler.jsonc` / `wrangler.json` belong in `void.config.ts` (convert `wrangler.toml` to JSON first). `void init`, `void deploy` and `void migrate` convert them and save backups under `.void/config-migration/`. Use `void migrate` to do it without deploying, and see `void-project-setup`.

The docs disagree on keeping the file: `reference/config.md` says root wrangler files are migrated and backed up, while `integrations/cloudflare.md` tells an existing directly-deployed app to keep its root `wrangler.jsonc` and run `void deploy`, which migrates it. Read together: leave the file in place until the first deploy or migrate has converted it, then run from `void.config.ts`.

Done when `void.config.ts` and `void.lock.json` exist, `.void/config-migration/` holds the backups.

## 4. Add, rename or type a binding

- Defaults: `DB` (D1), `KV`, `STORAGE` (R2), `AI`, `ASSETS`, `QUEUE_*`; Durable Objects take their name from the file in `durable-objects/`. Void infers them from imports (see `void-app-shape-and-inference` to enable, disable or rename one with `inference.bindings`).
- A custom binding (an extra D1, a service) goes under `cloudflare`, for example `services: [{ binding: 'API', service: 'my-api-worker' }]`. Void keeps it and adds missing inferred resources.
- Type it: put `"types": ["void/env"]` in `compilerOptions` of `tsconfig.json`, then run `void prepare` (or start the dev server or a build); the binding is typed on `c.env`. RPC methods on service and Durable Object bindings need a `declare module 'void'` augmentation of `CloudBindings`.
- Raw access outside Void routes: the docs disagree. `integrations/cloudflare.md` says only TanStack Start and React Router import `env` from `cloudflare:workers`; the framework overview adds SvelteKit 3, Analog and Astro, and says `platform.env` (SvelteKit 2) and `event.context.cloudflare.env` (Nuxt). Follow your framework's setup guide.

Done when `c.env.<NAME>` typechecks.

## 5. Commit the right files

- Commit `void.config.ts` and `void.lock.json`: the lock records provisioned resource IDs and append-only Durable Object migration history. Delete or reorder no deployed migration step.
- Keep `.void-wrangler.jsonc` and `.cloudflare/` out of Git. `void migrate` adds them to `.gitignore`; check the entries.
- To remove a value Void generated earlier, delete it from the `resolved` object in `void.lock.json`; Void refreshes the generated file on the next command. Put ongoing settings in `cloudflare`.
- Run the first deploy from one machine, then commit the lock before deploying from others or CI.

Done when `git status` shows no `.void-wrangler.jsonc` and the lock is staged after a change.
