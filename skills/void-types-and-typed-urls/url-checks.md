# URL checks

Read when TypeScript rejects a URL string, a redirect or rewrite target comes from the request, or the app has a root dynamic route (`/[slug]`, `/[...slug]`).

## What typed routes accept

- A string must match one of your routes, optionally followed by a query string or hash. Links also accept same-page `?page=2` and `#comments`, plus `http://`, `https://`, `mailto:` and `tel:`. Relative paths such as `../settings` are rejected.
- URLs served only by a root dynamic route need `routeUrl('/[...slug]', { params: { slug: 'dashboard' } })`. Catch-all `[...path]` takes the whole remaining path as one value; unnamed `[...]` uses the `'*'` key.
- `void/routes` exports `RouteUrl` (a route of yours; `routeUrl()` returns it; `c.rewrite()`, `useIslandForm()` and `revalidate({ paths })` accept it) and `Href` (a `RouteUrl`, same-page query or hash, or external URL; links and `c.redirect()` accept it).

## Values checked at runtime

Cast a URL you have validated, with the narrowest type: `post.path as RouteUrl` for one of your routes, `user.website as Href` for a link target. A cast skips the check and Void does not validate redirect targets at runtime. For `?redirectTo=` compare the origin before redirecting:

`const requested = new URL(c.req.query('redirectTo') ?? '/', c.req.url);`
`return c.redirect(requested.origin === new URL(c.req.url).origin ? requested : '/');`

## Prerender and param types

Annotate `getPrerenderPaths()` as `Promise<PageParams<'/blog/[slug]'>[]>` and read params with `c.req.param() as PageParams<'/posts/[slug]'>`; Void does not infer these from the file name. Annotate a `routing.prerender` list with `satisfies RouteUrl[]`. `useParams<'/users/[id]'>()` takes a page pattern, not an API or WebSocket route.

Done when each cast sits next to the runtime check that justifies it.
