---
name: void-astro
description: "Sets up Void in an Astro app: Astro 7+ (Vite 8), the Cloudflare adapter pointed at .void-wrangler.jsonc, nodejs_als, prerender = false on binding pages, env via void/env. Use when adding Void to Astro, when void/db fails at runtime in Astro, or when a page reads bindings."
---

# Void in Astro

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/astro.md`.

## Check the version

Astro 7 or later is required, because Void needs Vite 8.

Done when `package.json` has `astro` >= 7.

## Configure Astro and Void

`npm install -D @astrojs/cloudflare void`, then in `astro.config.mjs`:

```js
export default defineConfig({
  adapter: cloudflare({ configPath: "./.void-wrangler.jsonc" }),
  vite: { plugins: [voidPlugin()] },
});
```

and in `void.config.ts`:

```ts
export default defineConfig({
  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-02-24",
    compatibility_flags: ["nodejs_als"],
  },
});
```

`nodejs_als` is required for `void/*` runtime helpers (`void/db`, `void/kv`) in Astro; without it they fail at runtime. The page puts the compatibility keys under `cloudflare`; other pages put them under `worker` (basics skill).

Done when the adapter names `./.void-wrangler.jsonc`, `nodejs_als` is in `compatibility_flags`, and `void prepare` exits 0. Lint: `framework-compat-flags`, `void-wrangler-config-path`.

## Opt binding pages out of prerendering

Any page or API route that reads runtime bindings exports `export const prerender = false;` (in `.astro` pages, inside the frontmatter). Use `void/db` and the other helpers in API routes and server-side code. Cron handlers go in `crons/`, queue consumers in `queues/`. Auth: use Better Auth's Astro integration.

Done when every file that imports `void/*` or `cloudflare:workers` exports `prerender = false` (lint: `astro-prerender-false`).

## Read env and raw bindings

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. This page says it replaces `astro:env`; `overview.md` lists only TanStack Start, React Router and vinext (basics skill, "Where the docs disagree").

Client-exposed schema keys are always `VITE_*`, also in Astro. Astro's `PUBLIC_*` convention still applies to direct `import.meta.env` access and does not change the `void/env` server/client boundary.

Raw bindings (D1, KV, R2): `import { env } from "cloudflare:workers"`, which works in dev and production.

Done when env keys are read through `void/env` and raw bindings through `cloudflare:workers`.

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first). Remove `routing.notFound` if set; Astro ignores it.
