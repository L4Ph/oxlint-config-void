---
name: void-sveltekit
description: "Sets up Void in a SvelteKit app: supported versions (SvelteKit 3 or 2.62+), adapter-cloudflare pointed at .void-wrangler.jsonc, tsconfig extends and types, void prepare before typecheck, env, raw bindings. Use when adding Void to SvelteKit, when typecheck fails because .void/tsconfig.json is missing, or when upgrading from Kit 2 to Kit 3."
---

# Void in SvelteKit

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/sveltekit.md`.

## Pick the version track

SvelteKit 3 with `@sveltejs/adapter-cloudflare` 8, or SvelteKit 2.62 or later with adapter-cloudflare 7. Steps below are Kit 3; Kit 2 differences are in [kit2.md](kit2.md), read when `@sveltejs/kit` is 2.x.

Done when `package.json` shows one of those two pairs.

## Configure Vite

`npm install -D @sveltejs/adapter-cloudflare void`, then:

```ts
plugins: [
  voidPlugin(),
  sveltekit({
    adapter: adapter({
      config: './.void-wrangler.jsonc',
      platformProxy: { configPath: './.void-wrangler.jsonc' },
    }),
  }),
],
```

Put Cloudflare settings in `void.config.ts` (`cloudflare.name`, compatibility settings with `nodejs_compat`; the home of the compatibility keys is a docs inconsistency, see the basics skill).

Done when both adapter options name `./.void-wrangler.jsonc`. Lint: `void-wrangler-config-path`.

## Configure tsconfig and sync order

```json
{
  "extends": ["$app/tsconfig", "./.void/tsconfig.json"],
  "compilerOptions": { "types": ["$app/types", "void/env"] },
  "include": ["src", "db", "crons", "queues", "*.ts"]
}
```

`.void/tsconfig.json` is generated, so it does not exist after a fresh clone. Run `void prepare` after a fresh clone and before typechecking in CI, so the file exists before SvelteKit syncs its config. Use `package.json` subpath imports (`#lib`) for Kit 3 aliases.

Done when, in a clean checkout, `void prepare` followed by the project's typecheck exits 0, and CI runs `void prepare` before the typecheck step.

## Use Void features

Call `void/db`, `void/kv`, `void/storage`, `void/ai` in `+page.server.ts` loads, actions and `+server.ts` routes, never in `.svelte` files or universal `+page.ts` / `+layout.ts` (lint: `sveltekit-no-void-in-client`). Cron handlers go in `crons/`, queue consumers in `queues/`. Auth: use Better Auth's SvelteKit integration.

## Read env and raw bindings

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. `overview.md` lists only TanStack Start, React Router and vinext for `void/env`; this page says to use it (basics skill, "Where the docs disagree").

Raw bindings in Kit 3: `import { env } from "cloudflare:workers"` in server code. `platform.env` is the Kit 2 route.

Done when server code reads env through `void/env` and bindings through `cloudflare:workers` (Kit 3).

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first). Remove `routing.notFound` if set; SvelteKit ignores it.
