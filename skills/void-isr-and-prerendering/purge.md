# Purge details

Read before purging a rewritten page, or when a purge shows no effect.

## Rewritten pages

The cache key of a dispatch rewrite holds both the destination and the original path, so `/en/docs/foo` requested directly and `/docs/foo` rewritten to it are separate entries. Purge the destination, `revalidate({ paths: ['/en/docs/foo'] })`; that clears both variants. Purging only `/docs/foo` clears nothing, because entries are stored under the destination.

## Scope of a purge

- `revalidate()` clears shared storage and the current data center's edge cache. Other data centers keep serving cached responses until their cache lifetime ends, and a data center that never rendered the HTML generates Pages data live.
- In local development `revalidate()` is a no-op, since there is no edge ISR cache. A purge check needs a deployment, so mark it as such: after the purge, request the page from the deployed URL and confirm the new content (this may take until other data centers expire).
- With `routing.typedRoutes` each path must match a route; cast a runtime-validated path with `as RouteUrl`.

Done when the deployed URL serves the changed content after the purge.
