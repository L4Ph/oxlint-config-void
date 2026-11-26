# Embedding the built app and single executables

Docs: `integrations/nodejs-bun-deno.md`, "Build Output", "Programmatic Usage".

## Embed in another server

`dist/ssr/app.js` default-exports the Hono app; `dist/ssr/index.js` imports it and starts the server. To embed, call `app.fetch(new Request(url))` from your own server (Express, Fastify, a serverless `fetch` handler, tests).

Done when `await app.fetch(new Request('http://localhost/api/hello'))` returns a response in your harness.

## Serve the client build from somewhere else

For a single executable, pass an `ASSETS` object with `fetch(request)` as part of the env argument of `app.fetch()`. Void then reads the client manifest, scripts, styles and `public/` files from it instead of `dist/client`. Keep the server's existing `env` values when you add `ASSETS` (spread them), because `getConnInfo()` reads the incoming request from them.

Node (single executable application): store assets under their URL paths, including `/.vite/manifest.json`, `/assets/...` and files copied from `public/`, and answer from `node:sea`:

```ts
serve({ fetch: (request, env) => app.fetch(request, { ...env, ASSETS }), port: 3000 });
```

`ASSETS.fetch` returns `new Response(getAsset(pathname), { headers: { 'content-type': type } })` and a 404 `Response` when the asset is missing.

Bun (`bun build --compile`):

1. Import each client file with `{ type: 'file' }` in a generated module (`client-files.ts`) that maps URL paths (`/.vite/manifest.json`, `/assets/<name>.js`) to the imported paths.
2. Regenerate that module after every `vite build`; asset file names change with each build.
3. Do not list client scripts as build entry points; Bun would bundle them as executable code.
4. Serve with `Bun.serve({ fetch: (request, server) => app.fetch(request, { server, ASSETS }), port: 3000 })` and answer `ASSETS.fetch` with `new Response(Bun.file(files[pathname]))`. Passing Bun's `server` keeps `getConnInfo()` working.

Done when the compiled executable answers a page request with its scripts and styles loading (no 404 for `/assets/*`), and the generated module's file names match the latest `dist/client/assets`.
