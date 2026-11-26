---
name: void-types-and-typed-urls
description: "Gets Void's generated types, tsconfig, typed URLs and typed fetch right: .void/tsconfig.json, binding and context-variable typing, routing.typedRoutes, routeUrl(), void/client fetch. Use when types are missing after a clone, c.env or c.get() is untyped, a URL string fails to type-check, or a typed fetch call misbehaves."
---

# Void types and typed URLs

Void generates `.void/` (types, tsconfig) from your routes, pages, schema and config. Lint covers import paths, annotation shapes and `fetch` argument shapes (families `typed-urls`, `typed-fetch`, `config`); this skill covers regenerating and reading type errors.

## 1. Extend the generated tsconfig

1. `tsconfig.json` extends `./.void/tsconfig.json`. In a project that already has a tsconfig run `void init --tsconfig`; it adds the Void types and keeps your settings (use it when the config already uses `extends`).
2. Add `"types": ["void/env"]`; it declares the global `Cloudflare.Env` bindings (`DB`, `KV`, `STORAGE`, `AI`, `SANDBOX`, `ASSETS`). The docs' `include` lists `src`, `routes`, `middleware`, `crons` and `queues` and no `pages`; add what your project needs and let the typecheck show gaps.

Done when `tsc --noEmit` resolves `void`, `void/routes` and `void/env` imports.

## 2. Regenerate types

Run `void prepare` after a fresh clone, in CI before typechecking, and after any change to `void.config.ts`, `env.ts`, schema, routes or pages. `vite dev` and `vite build` also write `.void/`. It generates files only: no remote state, nothing destroyed.

Done when `.void/` exists and the type errors you saw about missing modules or route names are gone.

## 3. Type bindings and context variables

Two separate mechanisms:

- Bindings on `c.env` (rate limiters, service bindings, Durable Objects, KV, D1): declare them under `cloudflare.*` in `void.config.ts`, then run `void prepare`. For RPC methods or other special shapes augment `CloudBindings` in a file your tsconfig includes: `declare module 'void' { interface CloudBindings { AUTH: Fetcher & { check(): Promise<boolean> } } }`.
- Variables set with `c.set()` and read with `c.get()` (including `shared` and `headDefaults`): augment `CloudContextVariables` the same way. Do not put them in `Cloudflare.Env`, which only types bindings.

Done when `c.env.MY_BINDING` and `c.get('requestId')` type-check without assertions.

## 4. Let handlers infer

Leave route handler return types unannotated. The inferred return types and validator schemas become the generated `RouteMap` that `void/client` fetch consumes.

## 5. Turn on typed routes

1. Set `routing: { typedRoutes: true }` in `void.config.ts`. It is `false` by default; apps from `void init` have it on.
2. Restart `vite dev` or run `void prepare`.
3. Build dynamic URLs with `routeUrl('/users/[id]', { params: { id }, query, hash })`. Supply every path parameter; a missing or invalid one throws `TypeError`. It encodes values for you, which a template literal does not.

String checks match route patterns only: `/users/[id]` also accepts `/users/` and `/users/42/edit`. Validate untrusted URLs at runtime.

Read [url-checks.md](url-checks.md) when TypeScript rejects a URL string, a redirect target comes from the request, or a root dynamic route exists.

Done when a misspelled `href` is a type error and `routeUrl` output passes.

## 6. Call routes with void/client fetch

`import { fetch, FetchError } from 'void/client'`.

- It returns parsed JSON, or `undefined` for a 204. It never returns a `Response`; do not call `.json()`.
- Non-2xx throws `FetchError` with `status`, `data` and `response`: `catch (e) { if (e instanceof FetchError) ... }`.
- It retries on 408, 429 and 5xx. The two docs pages word the default differently: the reference table says it auto-retries on those statuses, and the options table says `retry` defaults to 1 for GET. For a non-idempotent call (POST that charges, sends mail, creates a row) pass `retry: 0`.
- Omitting `method` sends GET; pass `method` for everything else.

Done when a failing route is caught as `FetchError` and a mutating call shows one request in the network log.
