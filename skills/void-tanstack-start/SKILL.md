---
name: void-tanstack-start
description: "Sets up Void in a TanStack Start app: voidPlugin() beside the framework plugin, env via void/env with VITE_* client keys, a custom Worker entry, Durable Object classes declared under cloudflare. Use when adding Void to TanStack Start, exporting a Durable Object or Workflow class, or reading env in a server function."
---

# Void in TanStack Start

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/tanstack-start.md`.

## Install and configure

1. `npm install -D void`. Add no separate Cloudflare adapter; Void provides the Cloudflare Vite plugin.
2. In `vite.config.ts`, list `voidPlugin()` first:

```ts
plugins: [
  voidPlugin(), // must come before the framework plugin
  tanstackStart(),
  react(),
],
```

Done when `voidPlugin()` is the first entry of `plugins` and `void prepare` exits 0. Lint: `void-plugin-before-framework-plugin`, `no-cloudflare-vite-plugin-with-void`.

## Use Void in server functions

Call `void/db`, `void/kv`, `void/storage`, `void/ai` inside `createServerFn().handler(...)` only. Put cron handlers in `crons/` and queue consumers in `queues/`. Auth: use Better Auth's TanStack Start integration (Void-managed auth is unsupported in framework mode).

Done when no browser module imports a `void/*` helper (lint: `tanstack-void-in-server-fn`).

## Read env values

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. Client-exposed keys are named `VITE_*`. Here `overview.md` and this page agree. Raw bindings come from `import { env } from "cloudflare:workers"`.

Done when each key read on the server goes through `void/env` and each browser-visible key starts with `VITE_`.

## Export a Durable Object or Workflow class

Skip this section unless the Worker exports such a class.

1. Set `cloudflare.main` in `void.config.ts` to your entry module (relative to the app root):

```ts
export default defineConfig({ cloudflare: { main: './server.ts' } });
```

2. In that module, default-export TanStack's handler and add the named class exports:

```ts
import handler from '@tanstack/react-start/server-entry';
export { Counter } from './counter';
export default handler;
```

3. Declare the class under `cloudflare` as well, for example `cloudflare.durable_objects`. Without `cloudflare.main`, Void uses TanStack's default server entry; a package entry such as `@tanstack/react-start/server-entry` also works.

These settings apply to `void deploy --platform cloudflare`. On a Void platform, use Durable State (`guide/durable-state.md`) instead.

Done when the exported class name appears both in the entry module and in the `cloudflare` binding setting, and `void prepare` exits 0.

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first).
