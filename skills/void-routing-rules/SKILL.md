---
name: void-routing-rules
description: "Writes Void routing rules: redirects, rewrites, fallbacks, response headers, _redirects and _headers files, c.rewrite(), c.redirect(), alwaysUseHttps. Use when moving URLs, serving content at another path, adding cache or security headers, redirecting to HTTPS or one host, or when a rule does not fire."
---

# Void routing rules

Rules live in `routing.redirects`, `routing.rewrites`, `routing.fallbacks` and `routing.headers` of `void.config.ts`, in a `_redirects` file in `publicDir`, or in middleware. Lint covers rule shape, ordering and `c.rewrite()` usage (family `edge`); this skill covers choosing a mechanism and how rules interact with each other and with the cache.

## 1. Choose the mechanism

| You want | Use |
| --- | --- |
| The browser address to change | redirect (`routing.redirects`, or `c.redirect()` in code) |
| Content served at another path, address unchanged, fixed mapping | `routing.rewrites` |
| The same, destination depends on the request (cookie, header) | `c.rewrite()` in middleware |
| A catch-all that must never pre-empt a real file or route | `routing.fallbacks` |
| HTTP sent to HTTPS | `routing.alwaysUseHttps: true` (step 4) |

Rewrites run before static assets and application routes, so a rewrite shadows a real file or route at its source URL. Fallbacks fire only when nothing else matched (the request would otherwise 404). An SPA app already falls back to `/index.html`; do not add `'/*': '/index.html'`.

## 2. Order the rules

- Sources start with `/`; `*` matches any characters including `/`; `:splat` in the destination is the matched part.
- In each group the first match wins, so write specific patterns before catch-alls. Rules in `void.config.ts` beat `_redirects` rules.
- Header rules differ: all matching rules merge and the last one wins per header name. Put the intended value last.
- Redirects run before the Worker. A redirected source URL never reaches assets, ISR, SSR or middleware.

Done when, in `vite dev`, the `X-Void-Routing` response header names the rule you intended and where it was declared (`curl -I`).

## 3. Write redirects

1. `routing.redirects: { '/old': '/new', '/blog/*': { to: '/posts/:splat', status: 301 } }`. A string destination is `302`; allowed statuses are 301, 302, 303, 307, 308.
2. The destination's query merges with the incoming one (destination wins per key). End the destination with `?` to drop the incoming query.
3. From a handler, loader, middleware or action use `c.redirect()`; it sends exactly the location you give and adds no request query. See `void-actions-and-forms` for the action exceptions.
4. For one host only, prefix the source: `'https://www.example.com/*': 'https://example.com/:splat'` (literal `https://` host, no wildcard, no port). Path-only sources apply on every domain of the project.
5. In `_redirects`, `200` marks a fallback and `200!` a rewrite; redirects need no `!`.

**Before deploying a host-prefixed rule run `void domain add <hostname>`.** It changes remote state (a hosted project prints DNS records; a direct Cloudflare project adds a `custom_domain` route and syncs route config) and is not destructive. Confirm first: a legacy singular `route` field is converted to `routes` so the new domain cannot shadow the old route; wildcard hostnames are unsupported, so add each subdomain. `void domain status <hostname>` then shows verification progress; the rule starts working when the domain turns active.

Done when `curl -I` on the source returns the status and `Location` you wrote.

## 4. Redirect HTTP to HTTPS

Set `routing.alwaysUseHttps: true` (default `false`) instead of a redirect rule. It sends `308` keeping path, query and method, leaves localhost on HTTP, and needs the Cloudflare target. On a direct Cloudflare deployment also enable Always Use HTTPS on the zone, so assets Cloudflare serves directly are covered. For SvelteKit, Nuxt, Astro, Analog, TanStack Start, React Router or vinext on the direct target, configure HTTPS in the framework or zone; use `routing.alwaysUseHttps` only for their static builds.

## 5. Rewrite in middleware

Read [middleware-rewrites.md](middleware-rewrites.md) before writing `c.rewrite()`.

## 6. Headers

- A `Cache-Control` rule overrides Void's default for the URLs it matches. Keep public cache rules away from signed-in pages and `/api/auth/*`: Void keeps cookie and credentialed responses private, but on a Void platform header rules can replace those settings.
- Header rules do not apply to ISR cache responses. For security headers on cached pages set them in the app's own response.
- Set cookies in the app's response. Scope them (domain, path, name) carefully on a shared domain, because your cookie headers can affect other apps there.

## 7. Framework apps on direct Cloudflare

Configure redirects, rewrites, fallbacks and headers through the framework or Worker, not `routing.*`. Put `_headers` in the framework's public asset directory (it covers static files); use the framework's server code for Worker responses.
