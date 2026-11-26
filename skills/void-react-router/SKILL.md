---
name: void-react-router
description: "Sets up Void in a React Router v7 app: voidPlugin() beside the framework plugin, env via void/env, and server-secret reads Void rejects in route files. Use when adding Void to React Router, reading env in a loader or action, or when a build rejects a route file for a secret read."
---

# Void in React Router v7

Read `void-meta-framework-basics` first (runtime wiring, caching, deploy, where the docs disagree). Docs: `node_modules/void/docs/integrations/frameworks/react-router.md`. This page is the TanStack Start setup minus the Worker entry.

## Install and configure

1. `npm install -D void`. Add no separate Cloudflare adapter.
2. In `vite.config.ts`, list `voidPlugin()` before `reactRouter()`:

```ts
plugins: [
  voidPlugin(), // must come before the framework plugin
  reactRouter(),
],
```

Done when `voidPlugin()` is the first entry of `plugins` and `void prepare` exits 0. Lint: `void-plugin-before-framework-plugin`, `no-cloudflare-vite-plugin-with-void`.

## Use Void in loaders and actions

Call `void/db`, `void/kv`, `void/storage`, `void/ai` in `loader` and `action` functions (or a `.server.ts` module they import), never in route components. Cron handlers go in `crons/`, queue consumers in `queues/`. Auth: use Better Auth's React Router integration.

Done when no component body references a `void/*` helper (lint: `react-router-void-in-loaders-only`).

## Read env values

Declare keys in `env.ts`; read them with `import { env } from "void/env"`. Public client keys are `VITE_*`. Raw bindings: `import { env } from "cloudflare:workers"`.

Server secrets: read them in a `.server.ts` companion module and import that module into the loader or action. Void rejects server-secret reads in route files that also contain browser components.

Done when the project's build (`vite build`) passes with the secret read living in a `.server.ts` file and no route file that renders a component reads a server key.

## Deploy

Follow the Deploy section of `void-meta-framework-basics` (`void deploy` changes remote state; confirm first).
