# Middleware rewrites

Read before writing `c.rewrite()`, or when a rewrite loops, 404s on an asset, or skips access checks.

## Write it

- Return the result: `return c.rewrite('/' + locale + c.req.path)`. The destination starts with a single `/` and is an internal path. External URLs and `//host` throw; use `fetch()` for cross-origin calls.
- Middleware runs again at the destination. Skip paths already rewritten (`if (c.req.path.match(/^\/(en|ja)(\/|$)/)) return next()`) to avoid a loop, and guard once-only work (logging, counters) with `if (c.isRewritten()) return next()`.
- A destination without `?` keeps the incoming query; with `?` it replaces it: `c.rewrite('/search')` keeps `?q=...`, `c.rewrite('/search?q=all')` does not.
- Keep authorization checks on every destination that needs them. A rewrite does not carry the source's checks, so a protected destination must check on its own.
- `c.originalUrl()` gives the pre-rewrite URL (or `null`); use it for canonical links and locale detection.

## Assets

`c.rewrite()` targets application routes. A destination ending in a known asset extension (`/hero.png`, `/app.css`, `/data.json`) throws `VoidAssetRewriteError`. Serve an asset at another URL with `routing.rewrites` or a `_redirects` `200!` rule. `.html` is exempt.

## Client navigation

Rewrites run on the server. `Link` navigation does not trigger them, and a client-side `<Link href="/docs">` may fetch the loader data for `/docs`, not for the rewritten `/en/docs`. When the destination has a different loader use `<a href="/docs">` for a full request, or a redirect when the address should change.

## Cache

ISR entries sit under the destination path; purge that, not the source (see `void-isr-and-prerendering`). Middleware `c.rewrite()` runs after the ISR lookup and adds no cache variant.

Done when the rewritten URL serves the destination's content, the address bar is unchanged, and the dev `X-Void-Routing` header reads `c.rewrite -> ... (middleware)`.
