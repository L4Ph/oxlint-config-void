---
name: void-app-shape-and-inference
description: Chooses a Void app's shape and what Void infers from code. Use when auto-detection picks the wrong app type (inference.appType), when a binding is missing, unwanted or needs another name (inference.bindings), when auth or a database is inferred unexpectedly, or when deciding which Void features a meta-framework app gets.
---

Void reads the project to decide the app type and which Cloudflare resources to bind. Config key shapes are the lint family `config`; this skill holds which shape fits and why inference chose a binding.

## 1. Pick the shape

| Shape | Layout |
|---|---|
| API-only | `routes/` alone |
| SPA + API | frontend in `src/`, handlers in `routes/` |
| Pages mode | server-rendered `pages/` with `.server.ts` companions |
| Meta framework | the framework's own layout; detected from its package in `package.json` dependencies or devDependencies |
| SPA, no backend | detected when `vite` is a dependency and no backend files exist |
| Static site | detected from a known static-site generator dependency, or deployed with `--dir` |

Choose one of the first three for a native Void app. Detected packages for meta frameworks: `@tanstack/react-start`, `@react-router/dev`, `@sveltejs/kit`, `nuxt`, `@analogjs/platform`, `astro` (Astro needs v7 or later).

A meta-framework app keeps its own routing and SSR and follows `integrations/frameworks/<framework>.md`, not the Void app layout. Void adds binding inference, typed DB queries, migrations, crons, queues and caching once `voidPlugin()` is in the framework's Vite config. It does not add Void-managed auth: use Better Auth's own integration for the framework (see `void-auth`).

The docs list the supported frameworks inconsistently: the sentence in `guide/app-types.md` names TanStack Start, React Router, SvelteKit, Nuxt and Astro, while its table and the framework overview also list Analog. Treat Analog as supported.

Done when the shape is named and, for a meta framework, `voidPlugin()` is in its Vite config.

## 2. Fix a wrong app type

Detection runs from the project structure. Set `inference.appType` to `"void"`, `"framework"`, `"spa"` or `"static"` in `void.config.ts` to lock it; `inference.outputDir` (default `dist`) names the output of the static types. Auto-detection stops, and asks for `appType`, when a static-site generator and backend files are both present.

Read `static-site-with-backend.md` for that case.

Done when the dev server or `void deploy` starts without asking for an app type.

## 3. Know what switches a resource on

Void scans source at startup. Imports that turn on a binding: `void/db` (`DB`), `void/kv` (`KV`), `void/storage` (`STORAGE`), `void/ai` (`AI`), `void/queues` (`QUEUE_*`), `void/sandbox`, `void/live`, `defineDurableState()` modules in `durable-objects/`. Reading `env.DB` or `c.env.DB` (also `c.env['KV']` and destructuring) switches the matching binding on too.

Auth turns on from an import from `void/auth`, or from importing `auth` from `void/client` or a framework subpath (`void/client/react`, `/vue`, `/svelte`, `/solid`). Importing only `fetch` from those does not enable it.

- Scanned files: `.ts`, `.tsx`, `.mts`, `.js`, `.jsx`, `.mjs` and Astro frontmatter. Vue and Svelte component files are not scanned: put resource imports in a `.ts` file or the page's `.server.ts`.
- Scanned directories: `routes/`, `middleware/`, `queues/`, `pages/`, `crons/`, `email/`, `src/` in a native app (the `sourceDir` tree when set); `src/`, `app/`, `routes/`, `server/`, `pages/`, `crons/`, `queues/` in framework mode. `inference.scanDirs` replaces these lists entirely, so list every directory that holds a resource import.
- Keys chosen at runtime (`c.env[name]`) are not detected; override them in step 4.

Done when the binding you expect is in the dev server's `c.env` and typechecks after `void prepare`.

## 4. Override a binding

Set `inference.bindings` to enable, disable or rename what inference got wrong. Each key (`db`, `kv`, `storage`, `ai`) takes `true` (default name), `false`, or a string (custom name); `email` takes a boolean. Keys you omit are still inferred.

```ts
inference: { bindings: { kv: false, storage: 'MY_BUCKET' } }
```

Custom names work with `void/db`, `void/kv` and `void/storage`. For `void/ai` a custom name works on direct Cloudflare deploys only; managed Workers AI uses the platform proxy.

`db: false` does not remove the database from an app that uses auth or has checked-in migrations; Void still requires it. Remove the auth import or the migrations first if the app must have no database.

For an existing Worker's resource IDs and names, set them in `cloudflare` too (see `void-config-and-bindings`).

Done when the intended binding names appear on `c.env` and the disabled ones do not.
