---
name: void-isr-and-prerendering
description: "Controls caching of rendered Void pages: revalidate exports and patterns, routing.isr, prerender, revalidate(), x-revalidate, routing.revalidateQueryAllowlist, cache bypass rules. Use when a page is not cached, shows stale or per-user data, a query parameter is ignored, or purge or prerender behaves unexpectedly."
---

# Void ISR and prerendering

Revalidation (ISR) caches rendered public HTML and refreshes it in the background. It works with Void SSR, pages mode and supported SSR frameworks; for framework apps it caches public HTML documents, not data requests. Lint covers export literals and `revalidate()` usage (family `edge`, `pages`); this skill covers the reasoning about what gets cached.

## 1. Decide whether a page may be cached

Cache only pages whose HTML is the same for every visitor. Then set a TTL in seconds:

- `routing.revalidate: 60` globally, or per pattern `{ '/docs/*': 31536000, '/user/*': 0, '*': 30 }`. Rules match in order and the first match wins; `*` matches `/` too.
- `0` turns caching off for that path, or for the whole app when it is the global value (plain SSR).
- `31536000` (one year) keeps a page until the next deploy, because every deploy clears the ISR cache.
- Per page: `export const revalidate = 120;` in the `.server` file, a whole-number literal (`60 * 60` is ignored with a warning).
- `routing.isr: false` switches off all ISR and edge prerendering, including per-page `revalidate` and `prerender` exports, which become inert. `output: 'static'` build-time generation still runs.

Precedence, most specific first: the `x-revalidate` response header, the page's `revalidate` export, a `routing.revalidate` pattern, the global number or `"*"`. A page's export also caches the `GET` response of any `routes/` handler whose URL matches the page pattern (a catch-all page can capture `routes/now.ts`). Paths under `/api` are never cached. To keep a handler out, set `c.header('x-revalidate', '0')`.

Done when the TTL you expect is the one named by the highest-precedence source above.

## 2. Keep cacheable pages free of per-user output

Void caches only a complete `200`. All of these keep a response out of the cache, or evict a cached page that starts sending them:

- `Set-Cookie`, or `Cache-Control` containing `private`, `no-store` or `no-cache`.
- `Vary` on request headers (`Accept-Language`, `Origin`) or `Vary: *`; the response renders live. Void's own `X-VoidPages` is fine.

These requests bypass the cache and render on the Worker every time: any with `Cookie`, `Authorization` or `Cf-Access-Jwt-Assertion`, and ones negotiating `Accept: text/event-stream` or `text/markdown` (middleware that answers those runs on every request). So a page that serves signed-in users gets no benefit from ISR; give it TTL `0`.

Check: `curl -sI <url>` with no cookies shows no `Set-Cookie`, no `Vary` other than `X-VoidPages`, and no `private`/`no-store`/`no-cache` in `Cache-Control`. A second request is served from cache only on a deployment; `vite dev` has no ISR cache.

## 3. Allow the query parameters a page reads

By default every incoming query parameter is dropped from the cache key. A request with other parameters gets the cached page; if nothing is cached yet it renders live and is not stored. List the parameters that change output, keyed by source pattern:

`routing: { revalidateQueryAllowlist: { '/search': ['q'], '/products/*': ['variant', 'currency'], '*': [] } }`

Done when every query parameter a cached page reads appears in the allowlist for its path. Middleware `c.rewrite()` runs after the cache lookup, so it cannot make different content for one cached URL; use a real path or an allowlisted parameter.

## 4. Prerender

1. Export `prerender = true` from the `.server` file. A dynamic page also exports `getPrerenderPaths()` (annotated with `PageParams`; see `void-types-and-typed-urls`). Markdown pages and island pages with no loader and no dynamic params are prerendered automatically.
2. Prerendered pages default to a one-year TTL. Add `export const revalidate = 3600` when content must refresh sooner; once the TTL passes before the next deploy, the next request waits for a fresh render.
3. Prerender runs once per deployment before traffic moves; paths with TTL `0` are skipped; `routing.isr: false` turns it off.
4. Treat prerender as an optimisation. Failures are logged and never block the deploy; the page then renders on first request. The server-mode docs say invalid `getPrerenderPaths` entries are reported at deployment with the file name and index; the static-output docs (`ssg.md`) say the build stops. See `void-ssr-and-static-sites`.

Done when the deploy log lists the page as prerendered or you accept first-request rendering.

## 5. Purge

`revalidate({ paths: [...] })` or `revalidate({ all: true })` from `void/isr`, awaited, inside a route handler. Read [purge.md](purge.md) before purging a rewritten page or relying on a purge locally.

`revalidate({ all: true })` purges every cached page, and each deploy starts with an empty cache. Confirm with the person before running it against production traffic.
