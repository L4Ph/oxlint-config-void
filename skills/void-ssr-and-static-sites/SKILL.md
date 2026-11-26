---
name: void-ssr-and-static-sites
description: "Sets up custom SSR entries, static site generation and static hosting in Void: defineRender, output 'static', getPrerenderPaths, 404 pages, trailing slashes, inference.appType, routing.notFound. Use when building a static or pre-rendered site, writing a custom SSR entry, adding an API to a static generator, or serving assets."
---

# Void SSR and static sites

Lint covers config literals and `defineRender` asset tags (families `config`, `edge`, `pages`); this skill covers which mode to choose and the hosting traps.

## 1. Choose the mode

| You have | Set |
| --- | --- |
| Void pages that should be built to HTML | `output: 'static'` in `void.config.ts` |
| A pre-built site from another tool (VitePress, plain HTML) | `inference.appType: 'static'` (and `inference.outputDir`) |
| Your own router, HTML shell and hydration | custom SSR (step 2) |
| Pages that should be cached at the edge on a server app | `prerender`/`revalidate` (see `void-isr-and-prerendering`) |

`output` controls the rendering strategy of a Void app. `inference.appType` describes what the project is. They are different settings: `appType: 'static'` deploys files with no Void plugin and no Worker; `output: 'static'` prerenders a Void app and keeps a Worker only for server code and edge rules.

## 2. Write a custom SSR entry

1. Run `void gen ssr [--react | --vue | --svelte | --solid]`. It writes `src/main.ssr.ts(x)`, `src/main.client.ts(x)` and `src/App.<ext>` (local files only; nothing remote, nothing destroyed). Without a flag it detects the framework from `package.json`.
2. Keep exactly one server entry and one client entry; both are required.
3. In the server entry, wrap the renderer in `defineRender((c, assetTags) => ...)` (or export a named `render`). Put `assetTags.css` and `assetTags.preloads` in `<head>` and `assetTags.body` before `</body>`.
4. In the client entry hydrate the same root component the server rendered.
5. API routes and static files are served before custom rendering; unmatched non-API requests reach `render`.

Done when the served HTML holds the stylesheet link in `<head>` and the script tag before `</body>`, and the browser console shows no hydration mismatch.

## 3. Build a static site

1. Set `output: 'static'`. Pages then default to `prerender = true` and are written under `dist/client/`. Opt a page out with `export const prerender = false`; it then renders on request.
2. Give each dynamic page `getPrerenderPaths()` returning every required param (annotate with `PageParams`, see `void-types-and-typed-urls`). Dynamic pages without it are not prerendered.
3. For hosts such as GitHub Pages add `routing: { trailingSlash: true }` and write links with trailing slashes. On Cloudflare keep default HTML handling or `force-trailing-slash`; `drop-trailing-slash` is the wrong pairing.

Done when `vite build` succeeds and `dist/client/` holds one HTML file per path.

**Invalid prerender paths.** Here `ssg.md` says an invalid entry stops the build with the server filename and index. In server mode, `prerendering.md` says Void reports invalid entries at deployment and that prerender failures are logged and never block the deploy. Treat both as true for their mode, and confirm in the build or deploy log after changing paths.

## 4. Serve 404s

- A static build that prerenders a page gets a default `404.html`. To supply your own, add `public/404.html` or prerender a page at `/404`.
- Fully static Void deployments serve it with HTTP 404 by default; override with `routing.notFound` (`'single-page-application'`, `'404-page'`, `'none'`). Hybrid deployments answer in the Worker.
- Self-hosting `dist/client/`: configure the host to return `404.html` with status 404.
- Do not set `routing.notFound` for SvelteKit, Nuxt, Analog or Astro; they use their own error pages and ignore it. For TanStack Start, React Router and vinext set a complete asset policy in the framework's Cloudflare config.

Done when a missing URL returns status 404 with your page body (`curl -i`).

## 5. Add a backend to a static generator

Auto-detection sees the generator and the API routes and stops until you set `inference.appType`.

1. To deploy both, set `inference: { appType: 'void', build: 'vitepress build && vite build' }` (your generator's build first).
2. In `vite.config.ts` set `publicDir` to the generator's output (`.vitepress/dist`) so it becomes the build's assets. Keep `voidPlugin()` in the root `vite.config.ts` only.
3. Set `routing.notFound: '404-page'` so the Worker serves the generator's `404.html` for unmatched requests.
4. To deploy only the static output set `inference.appType: 'static'`.

Done when the build prints no appType prompt and an unknown URL returns the generator's 404 page.

## 6. Know when the Worker runs

In a fully static app files are served directly, but `_headers` or `_redirects` in `public/` need a small Worker on every request. On a hybrid app every page goes through the Worker if the app has middleware, auth, live updates, edge rules, a custom Vite `base`, a `routing.notFound` other than `"none"`, or a dynamic page at the root of `pages/` (such as `pages/[slug].vue`). Check this before assuming prerendered pages bypass the Worker.

Read [assets.md](assets.md) for asset caching, `run_worker_first`, and framework deployments on direct Cloudflare.
