---
name: void-server-routes-and-middleware
description: "Writes Void server routes and middleware: route files in routes/, withValidator input validation, per-route middleware, global middleware order, basicAuth gates and their bypasses. Use when adding an API endpoint, validating input, protecting a site or route with basicAuth, or writing middleware."
---

# Void server routes and middleware

A file in `routes/` maps to a URL and exports one handler per HTTP method. Lint covers handler shape, `withValidator` shape, middleware file shape and credential reads (families `handlers`, `convention-files`, `placement`); this skill covers design and the traps no config shows.

## 1. Create the route file

1. Run `void gen route <path> [--methods get,post,...]` to write `routes/<path>.ts` with a `defineHandler` export per method (default GET). It only creates a local file; nothing remote, nothing destroyed.
2. One route per URL pattern. `[id].ts` and `[slug].ts` match the same URLs, and renaming a parameter does not change priority, so sibling files that differ only in the parameter name are a mistake.
3. A `.dev` or `.prod` suffix before the extension limits a route to one environment (`api/debug.dev.ts`). A resource used only by `.dev` routes is not provisioned for production, so do not let a dev-only route be the only user of a resource production needs.
4. Prefix helpers with `_` so Void does not route them.

Done when `vite dev` answers the route and `void prepare` generates types for it.

## 2. Validate input

Validate with `defineHandler.withValidator({ body, query, params })(async (c, { body }) => ...)`. Do not parse and check by hand inside the handler: read `body`, `query` and `params` from the second argument.

- The route maps to a table: derive the schema from the Drizzle schema (`createInsertSchema`, exported as `insertUserSchema` in `@schema`).
- The route has no table: use any Standard Schema library (Valibot, Zod, ArkType).
- Install the validator library itself. No separate Standard Schema dependency is needed.
- A failed validation returns `400` with `{ error: 'Validation failed', issues: [{ slot, issues: [{ message, path }] }] }`. The same schemas type `void/client` fetch calls.

Done when a request with a bad body returns 400 with the issues, and a valid one reaches the handler with typed input.

## 3. Add middleware

- Global: `void gen middleware <name>` writes `middleware/NN.<name>.ts` with the next free number (local file only). The number sets order; the file default-exports `defineMiddleware(async (c, next) => { ...; await next(); })`. The `.dev`/`.prod` suffix does not apply in `middleware/`.
- Per route: pass middleware before the final handler: `defineHandler(authMiddleware, rateLimiter, (c) => ...)`. At most five, run in order. Each may return a response to stop the chain, or work after `await next()`. Raw Hono `MiddlewareHandler` functions (`cors(...)` from `hono/cors`, after installing `hono`) are accepted.

## 4. Gate a site with basicAuth

`basicAuth()` is a temporary gate for previews and pre-launch. Void's reserved `/__void` endpoints stay reachable. It works as `middleware/01.basic-auth.ts` (`export default basicAuth({...})`, whole app) or as an argument to `defineHandler` (one route); the docs show both.

1. Declare `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` in `env.ts` with `string()`.
2. Read them through callbacks: `username: () => env.BASIC_AUTH_USERNAME`, `password: () => env.BASIC_AUTH_PASSWORD`, so they resolve per request after Void binds the runtime env.
3. Set both in `.env` locally. If `password` resolves to empty, every request fails with a server error rather than passing the gate.
4. Put bypasses (health checks, public webhooks) in your own middleware that runs before the gate: give it a lower number than the `basicAuth` file (`01.bypass.ts` before `02.basic-auth.ts`). `basicAuth` has no bypass option.

**Before production: `void secret put BASIC_AUTH_PASSWORD`** (and the username) sets a production secret. It changes remote state and is not destructive; it overwrites an existing value of the same name. Confirm the target project, run it only when the person asks, and give the value through the masked prompt or stdin so it stays out of shell history and the repo. Production values must exist before deploy.

Done when an unauthenticated request to a protected URL returns 401, the bypass URL returns its normal response, and `/__void` still answers.
