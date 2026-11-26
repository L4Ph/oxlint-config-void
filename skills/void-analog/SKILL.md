---
name: void-analog
description: "Sets up Void in an Analog app: nitro-cloudflare-dev for the dev platform proxy, voidPlugin() with the cloudflare-module Nitro preset and void/nitro module, nodejs_compat and nodejs_als, env via void/env. Use when adding Void to Analog, when void/db cannot reach bindings in Analog dev, or when reading env in an Analog server route."
---

# Void in Analog

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/analog.md`.

## Install

`npm install -D void nitro-cloudflare-dev`. Void provides the local Cloudflare binding runtime; `nitro-cloudflare-dev` creates the platform proxy in development so `void/db`, `void/kv` and the other helpers can reach bindings.

Done when both packages are in `devDependencies`.

## Configure vite.config.ts

```ts
export default defineConfig({
  resolve: { mainFields: ["module"] },
  plugins: [
    analog({
      ssr: true,
      nitro: {
        preset: "cloudflare-module",
        cloudflareDev: { configPath: "./.void-wrangler.jsonc" },
        modules: ["nitro-cloudflare-dev", "void/nitro"],
      },
    }),
    voidPlugin(),
  ],
});
```

- `void/nitro` gives Analog API routes and page server loads your `void/db` and `@schema`.
- `modules` lists `'nitro-cloudflare-dev'` first, then `'void/nitro'`.
- Plugin order: this example puts `voidPlugin()` after `analog()`. TanStack Start and React Router say Void must come first; the SvelteKit example lists it first; no Analog text states a rule. Follow this example; if the build or dev proxy misbehaves, try the other order and tell the user which one worked.

Done when `nitro.modules` holds both entries in that order, `cloudflareDev.configPath` is `./.void-wrangler.jsonc`, and `void prepare` exits 0. Lint (holds these settings): `nitro-config`, `analog-main-fields`, `void-wrangler-config-path`.

## Create void.config.ts

```ts
export default defineConfig({
  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-02-24",
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
  },
});
```

`nodejs_compat` is required for Nitro's Cloudflare runtime; `nodejs_als` for `void/*` runtime helpers. The page puts the compatibility keys under `cloudflare`; other pages put them under `worker` (basics skill). Lint: `framework-compat-flags`.

Done when both flags are set in one location.

## Use Void in server code

Use `void/db`, `void/kv`, `void/storage`, `void/ai` in page server loaders (`*.server.ts`), actions and API routes only (lint: `analog-void-import-server-only`). Crons go in `crons/`, queue consumers in `queues/`. Auth: use Better Auth's integration.

## Read env and raw bindings

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. This page says it replaces the H3 event context and `env` from `cloudflare:workers` for env-var access; `overview.md` lists only TanStack Start, React Router and vinext (basics skill, "Where the docs disagree"). Keep the H3 event context or `import { env } from "cloudflare:workers"` for raw bindings (D1, KV, R2).

Done when env keys are read through `void/env` and raw bindings through one of those two mechanisms.

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first). Remove `routing.notFound` if set; Analog ignores it.
