---
name: void-node-bun-deno-targets
description: "Builds a Void app for the node, bun or deno target and replaces what exists only on Cloudflare. Use when setting target in void.config.ts, when a build fails on a void/db, void/kv, void/storage, void/auth, void/ai, void/sandbox or void/env import, or when planning cron, email, WebSockets, prerendering or auth outside Cloudflare."
---

# Void on Node.js, Bun or Deno

Docs: `node_modules/void/docs/integrations/nodejs-bun-deno.md`, `reference/config.md` (`target`), `guide/deployment.md` ("Other runtimes"). Lint holds the import bans; this skill gives the substitutes.

## Set the target and build

1. In `void.config.ts`: `defineConfig({ target: 'node' })` (or `'bun'`, `'deno'`; default `'cloudflare'`).
2. Node only: `npm install @hono/node-server`. Bun and Deno use their built-in servers.
3. Develop with `npx vite dev` (routes and pages reload on edit).
4. Build and run from the app directory:
   - Node: `npx vite build`, then `node dist/ssr/index.js`
   - Bun: `bunx vite build`, then `bun dist/ssr/index.js`
   - Deno: `deno run -A npm:vite build`, then `deno run -A dist/ssr/index.js`
5. The server listens on `PORT` or `3000`. Ship `dist/ssr` and `dist/client` together.
6. If a bundled package depends on a native addon or reads files next to its own code, add that dependency (the version the package uses) to the app's `dependencies`, so the build leaves it to the runtime. Void bundles installed packages that depend on `void` into `dist/ssr`.

Done when the build exits 0 and `curl http://localhost:3000/` (or `$PORT`) answers from `dist/ssr/index.js`.

## Replace what the target lacks

Importing `void/db`, `void/kv`, `void/storage`, `void/auth`, `void/ai`, `void/sandbox` or `void/env` is a compile-time error on these targets. Cloudflare bindings (D1, KV, R2, Workers AI) do not exist. Work through each row and leave none unanswered:

| Cloudflare feature                         | On node / bun / deno                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `void/db`, `void/kv`, `void/storage`       | An external provider through standard libraries                                                                                                              |
| `void/env` schema and secrets              | The host's environment: `process.env` (Node, Bun) or `Deno.env.get()` (Deno). Browser code: `import.meta.env.VITE_*` (embedded at build time, never secrets) |
| `void/auth`, `void/client` auth, `auth.ts` | Better Auth directly. Enabling auth through these fails the build                                                                                            |
| `*.ws.ts` WebSocket routes                 | None (they compile to Durable Objects). `void/ws` browser `connect()` still works against a separately hosted server                                         |
| `crons/`                                   | Files compile into the bundle but nothing runs them. Trigger the exported handler from `node-cron`, systemd timers or the host's cron                        |
| Inbound email, `sendEmail`                 | An external mail provider                                                                                                                                    |
| Edge prerendering                          | Build-time static generation (`guide/ssg.md`)                                                                                                                |
| `void deploy`                              | Not used. Run `vite build` and deploy `dist/` through the host's workflow                                                                                    |

Void warns and ignores `inference.bindings`, `remote`, `worker` and `routing.revalidate` in `void.config.ts` on these targets. Delete them.

These work the same on every target: file routing (`routes/`, `middleware/`), pages mode SSR, `void/client` typed fetch, `routing.headers`, `routing.redirects`, static generation, `vite preview`.

Done when no source file imports a banned module, no `*.ws.ts` file exists, `void.config.ts` holds none of the four ignored fields, and each cron file has a named external trigger.

## Docs inconsistency

`reference/config.md` says `void/client` "works normally" on non-Cloudflare targets, while `nodejs-bun-deno.md` says the build fails if you enable auth through `void/auth`, `void/client` or `auth.ts`. Use `void/client` for typed fetch only, and keep auth on Better Auth directly.

## Embed the app or build a single executable

Read [embedding.md](embedding.md) when importing `dist/ssr/app.js` into another server or compiling a Node single executable or a Bun executable.
