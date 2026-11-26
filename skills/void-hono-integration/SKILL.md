---
name: void-hono-integration
description: "Uses Hono inside a Void app: installing hono, middleware (built-in and third-party), response helpers, handler return values, JSX importSource for API-only, Vue or Svelte apps, HTTPException and redirects thrown from helpers. Use when importing from hono/*, adding Hono middleware, writing JSX in a route, or stopping a handler from a helper function."
---

# Hono in a Void app

Void handlers run on Hono. Void depends on Hono internally, but the app resolves only its own dependencies. Docs: `node_modules/void/docs/integrations/hono.md`, `guide/server-routing.md`. Lint holds the import checks; this skill is the setup note.

## Install hono before importing it

`npm install hono` whenever app code imports `hono/*`. Third-party packages (`hono-rate-limiter`, `@hono/*`) are installed the same way, in the app.

Done when every `hono/*` or `@hono/*` import in the app resolves to a package in the app's own `package.json`.

## Add middleware

Middleware files live in `middleware/NN.name.ts` (global middleware) or are passed to `defineHandler` per route. Wrap Hono middleware in `defineMiddleware`:

```ts
// middleware/01.cors.ts
import { cors } from 'hono/cors';
import { defineMiddleware } from 'void';
export default defineMiddleware(cors({ origin: 'https://example.com' }));
```

Per route: `defineHandler(bearerAuth({ token }), async (c) => { ... })`.

`hono/cache` stores one response per URL and serves it to every visitor. It skips requests with an `Authorization` header but not cookies. Use it only on routes whose response is identical for everyone, never on a route that reads the signed-in user. To cache pages, use revalidation (`guide/edge/revalidation.md`), which skips requests that carry a cookie.

Done when no route that calls `getUser()` or reads cookies is wrapped in `cache()`.

## Return from a handler

A handler may return a plain value, or set status and headers on `c` and return `c.json(...)` or a helper response such as `stream(c, ...)`. Void converts plain returns: object, array, number, boolean give JSON; a string gives `text/html`; `null` or `undefined` gives 204; a `Response` passes through.

```ts
export const GET = defineHandler((c) => {
  c.header('X-Custom', 'value');
  c.status(201);
  return c.json({ created: true });
});
```

Page loaders are different. `hono.md` says Hono's context helpers are available in every handler, but `guide/pages-routing/loaders.md` says to return data directly from a loader so `Date`, `Map`, `Set` and `bigint` survive; a JSON response (`c.json`, `Response.json`) converts through JSON. In `routes/` use either form; in a page `loader`, return the object.

Done when each page loader returns plain data and each `routes/` handler returns a plain value or one `c.*` response.

## Write JSX in routes

Use `.tsx` or `.jsx` for a handler with JSX. In React or Solid apps, render with the framework's server renderer (`c.html(renderToStaticMarkup(<h1>Hello!</h1>))`). In API-only, Vue or Svelte apps, install `hono` and set Hono's JSX in `vite.config.ts`:

```ts
oxc: { jsx: { runtime: 'automatic', importSource: 'hono/jsx' } },
```

`c.html()` then takes the JSX directly.

Done when a `.tsx` route in such an app builds and answers with HTML.

## Stop a handler from a helper

A helper that is not a handler cannot return a response for the handler. Throw `HTTPException` from `hono/http-exception`:

```ts
import { HTTPException } from 'hono/http-exception';
throw new HTTPException(404, { message: 'User not found' });
```

For a redirect, throw it with the redirect in `res`: `throw new HTTPException(302, { res: c.redirect('/login') })`. After a mutation use 303 (`c.redirect('/login', 303)`) so the next request is a GET. This works in loaders, actions and middleware, including client-side navigation. For a sign-in check, `requireAuth(c, { throwRedirect: '/login' })` (`reference/api/auth.md`) does the same and picks the status.

Done when helpers called from handlers throw `HTTPException` and return no `Response` that the caller ignores.
