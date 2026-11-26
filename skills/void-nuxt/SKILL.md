---
name: void-nuxt
description: "Sets up Void in a Nuxt app: nuxt.config.ts with the void/nitro module and cloudflare-module preset, the Cloudflare dev configuration for Nitro 2 or 3, the Nuxt 4.6.0 Windows inline setting, env via void/env. Use when adding Void to Nuxt, when nuxi typecheck cannot resolve @schema, or when reading env in a Nuxt server route."
---

# Void in Nuxt

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/nuxt.md`.

## Configure nuxt.config.ts

`npm install -D void` (it includes the Cloudflare tooling Nuxt's platform proxy uses in development). Then:

```ts
export default defineNuxtConfig({
  alias: { "@schema": resolve(import.meta.dirname, "db/schema.ts") },
  nitro: {
    preset: "cloudflare-module",
    modules: ["void/nitro"],
    cloudflare: { dev: { configPath: "./.void-wrangler.jsonc" } },
    // Required for Nuxt 4.6.0 on Windows.
    externals: { inline: [/[\\/]node_modules[\\/]nuxt[\\/]dist[\\/]/] },
  },
  vite: { plugins: [voidPlugin()] },
});
```

- `void/nitro` gives server routes your `void/db` and `@schema`. The top-level `alias` lets `nuxi typecheck` resolve `@schema`, because Nuxt typechecks server routes with the app's types.
- `cloudflare.dev` hands the dev server the bindings of Void's generated config. Nuxt runs it in development only when Nuxt's `compatibilityDate` is `2025-07-15` or later (a separate key from Void's `compatibility_date`).
- `externals.inline` is required on Nuxt 4.6.0 on Windows.
- The database module supports Nitro 2 and Nitro 3 prereleases. The docs say "use the Cloudflare development configuration for your Nuxt version; Nitro 3 uses its own Worker runner", show one snippet (`nitro.cloudflare.dev` above) and do not say which Nitro it targets or show the Nitro 3 form. Check the installed Nitro version, and if it is 3, consult Nitro's own Cloudflare dev docs for the Worker runner setting.

Done when `nuxt.config.ts` has the alias, `void/nitro` in `nitro.modules`, `configPath` set to `./.void-wrangler.jsonc`, `compatibilityDate` is `2025-07-15` or later, and `nuxi typecheck` resolves `@schema`. Lint: `nitro-config`, `nuxt-schema-alias`, `nuxt-compatibility-date`, `void-wrangler-config-path`.

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

The page puts the compatibility keys under `cloudflare`; other pages put them under `worker` (basics skill). Lint: `framework-compat-flags`.

Done when both flags are present in one location and `void prepare` exits 0.

## Use Void in server code

Use `void/db`, `void/kv`, `void/storage`, `void/ai` in server routes, API handlers and middleware under `server/`, never in components, pages or composables (lint: `nuxt-no-void-in-client`). Crons go in `crons/`, queue consumers in `queues/`. Auth: use Better Auth's Nuxt integration.

## Read env and raw bindings

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. This page says `void/env` replaces `useRuntimeConfig()` and `event.context.cloudflare.env` for env-var access; `overview.md` lists only TanStack Start, React Router and vinext for `void/env` (basics skill, "Where the docs disagree").

Keep two things as they are:

- `event.context.cloudflare.env` for raw bindings (D1, KV, R2): `const { DB } = event.context.cloudflare.env;`
- `useRuntimeConfig()` for non-env runtime config.

Done when env keys declared in `env.ts` are read only through `void/env` and raw bindings only through the event context.

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first). Remove `routing.notFound` if set; Nuxt ignores it.
