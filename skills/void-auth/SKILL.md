---
name: void-auth
description: Adds and uses Void-managed Better Auth in a native Void app. Use when guarding a route, loader, action or middleware (requireAuth, getUser, getAuth), adding a social provider, querying auth tables through @auth-schema, fixing cross-origin or CSRF rejections, or when auth requests hit rate limits.
---

Void configures Better Auth with the app's database, the `/api/auth` routes and a client. Import shapes and alias shapes are the lint families `auth` and `imports`; this skill holds the decisions.

## 1. Confirm the app qualifies

Void-managed auth needs a native Void app on Cloudflare. A meta-framework app (TanStack Start, React Router, SvelteKit, Nuxt, Analog, Astro) and a Node.js, Bun or Deno target use Better Auth's own integration instead; stop here for those.

Done when `package.json` lists no meta framework and `void.config.ts` has no non-Cloudflare `target`.

## 2. Turn auth on

Auth is on when the app imports anything from `void/auth`, imports `auth` from `void/client`, sets `auth` in `void.config.ts`, or has a root `auth.ts`. With none of these but one import, Void enables email/password only.

`auth` from `void/client` is the ready client. In a Pages app Void picks the framework client itself. In a SPA that uses Void for routes without Pages mode, import from the framework subpath (`void/client/react`, `/vue`, `/svelte`, `/solid`); the plain import binds the wrong client. Use `createAuthClient` only for a custom client.

Done when the dev server starts and `.void/better-auth-schema.ts` exists.

## 3. Add social providers

List them in `void.config.ts`: `auth: { providers: ['email', 'github'] }`. Credentials are env keys `AUTH_<PROVIDER>_CLIENT_ID` and `AUTH_<PROVIDER>_CLIENT_SECRET` (`cognito` also needs `AUTH_COGNITO_DOMAIN`, `AUTH_COGNITO_REGION`, `AUTH_COGNITO_USER_POOL_ID`, or the same values in `auth.ts`). Set them as local and production values as in `void-env-and-secrets`. Provider options, scopes, plugins and custom OAuth go in `auth.ts` (step 7).

Done when every listed provider has both keys in `.env` and, before a deploy, in `void secret list`.

## 4. Guard server code

- `requireAuth(c)` returns the user or throws 401. Use it in handlers, actions and middleware that need a signed-in user.
- `requireAuth(c, { throwRedirect: '/login' })` sends a signed-out visitor to the login page (302 for GET/HEAD, 303 otherwise) in loaders, actions and middleware; without it the 401 reaches the nearest `_error` component. Pass a fixed path of your app; validate any URL a user supplied. Signing in does not replay the rejected action, so the user submits again.
- `getUser()` / `getSession()` return the user or session, or `null`. Use them where anonymous visitors are allowed and handle `null`.
- `getAuth(c)` returns the Better Auth instance, anonymous requests included, so it does not require sign-in; pair it with `requireAuth(c)` when the route does. It throws when auth is not enabled.

Done when each protected route, loader and action calls `requireAuth` and an anonymous request to it returns 401 or the login redirect.

## 5. Read the session after a change

`getUser()` and `getSession()` return the session as it was at the start of the request. After an action signs a user in, up or out, redirect so the next request reads the new session. Calls such as `getAuth(c).api.signUpEmail` sign the current browser in as the new user; create an account for someone else with the admin plugin's `createUser`.

Done when the page after the action shows the changed user.

## 6. Query auth tables

`@auth-schema` exports `userTable`, `sessionTable`, `accountTable`, `verificationTable` and plugin tables. Add `"@auth-schema": ["./.void/better-auth-schema.ts"]` to `compilerOptions.paths` in the root `tsconfig.json`, keeping other aliases (such as `@schema` from `.void/tsconfig.json`). Reference `userTable.id` from your own tables; with `advanced.database.generateId: 'serial'` use an integer foreign key. Change auth through `auth.ts`: Void regenerates the `.void/better-auth-schema.ts` file, so edits to it are lost.

`AuthUser` and `AuthSession` carry plugin and `additionalFields` fields only when `tsconfig.json` extends the generated Void types.

On a direct Cloudflare deploy, run `void db generate` after any `auth.ts` change that adds tables or columns, review the SQL and commit it. A Void platform creates auth tables itself.

Done when `tsc` resolves `@auth-schema`, and for a direct Cloudflare deploy `git status` shows the new migration.

## 7. Customize in auth.ts

```ts
import { defineAuth } from 'void/auth';
export default defineAuth(({ defaults }) => ({ ...defaults, trustedOrigins: ['https://app.example.com'] }));
```

- Spread `defaults`; Void does not deep-merge.
- A hook that needs a helper importing `@auth-schema` (or your tables that reference it) loads it with `await import('./server/users')`; a fresh clone has no generated schema yet.
- Inside `auth.ts` and what it imports, let Better Auth infer hook types or use its `User` and `Session`; Void's `AuthUser` there creates a circular type.

Done when `void prepare` and the dev server start cleanly.

## 8. Cross-origin, cookies and caching

- A `POST`, `PUT`, `PATCH`, `DELETE` or WebSocket from another origin ignores the session unless the origin is in `trustedOrigins`. Add each separate frontend, including origins that call `getAuth(c).api` sign-in routes.
- Routes that set their own cookies check `Origin` themselves, for example with Hono `csrf()`.
- Signed-in responses get `Cache-Control: no-store`. A route may opt into `private, no-cache` with Hono `etag()`; a hand-set `ETag` must differ per user, or a 304 serves another account's page. The Back button can show a `private, no-cache` page after sign-out; keep `no-store` for pages that must not linger.

Done when a request from each listed origin carries the session and a signed-out Back navigation shows no user data.

## 9. Deploy and preview

Void creates `BETTER_AUTH_SECRET` on deploy and reuses it. Local development needs no secret; set `BETTER_AUTH_SECRET` to preview a production build locally.

Read `rate-limits-and-trusted-key.md` when auth requests return rate-limit errors (a proxy or end-to-end tests share one IP) or the limits must change.
