---
name: void-loaders-and-errors
description: "Chooses how a Void page loader reports data, slow data and failure: plain-data returns, defer(), c.status(), HTTPException, c.notFound(), and the _error and _not-found boundaries. Use when a loader is slow, a page needs a 404 or an error status, a deferred prop fails, or an error page renders wrong."
---

# Void loaders and errors

A loader lives in the page's `.server` file, runs on GET and returns the props. Lint covers return shapes and boundary file shape (families `pages`); this skill covers which failure mode to pick.

## 1. Return plain data

Return an object directly: `Date`, `Map`, `Set`, `bigint`, `RegExp`, `URL` and `undefined` then survive rendering, hydration, navigation and deferred loading. `Response.json()` switches to JSON conversion; functions and custom class instances cannot be sent.

The docs disagree here. `loaders.md` says return data directly. The island example in `islands.md` (loader and action) returns `c.json({ posts })`. Follow `loaders.md` for page props; reach for `c.json()` only when JSON conversion is acceptable.

Done when a `Date` or `Map` returned by the loader is still a `Date` or `Map` in the component.

## 2. Pick the failure mode

| Situation                                   | Write                                                                    | The visitor sees                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Page renders, status is an error (503, 403) | `c.status(503)` then return props                                        | The requested page, the HTTP status, normal props |
| Record is missing                           | `return c.notFound()` (or throw `HTTPException(404)`)                    | `_not-found` in the layout                        |
| Page must be replaced by an explanation     | `throw new HTTPException(403, { message })` (from `hono/http-exception`) | `_error` with `{ status, message }`               |

- Put only text that is safe to show visitors in an `HTTPException` message. Without an exception, production shows a generic message and logs the detail.
- In middleware, `c.notFound()` shows the root `_not-found` without running the loader; `return c.text('Not Found', 404)` sends a custom body instead.
- Middleware that throws before the loader makes Void show the root error component and skip the loader. With no matching boundary Void returns the exception's own response.
- Set the status and decide every redirect or exception before deferred streaming starts, never inside `defer()`.

Done when `curl -i` on the failing URL shows the intended status and, for boundaries, the intended component text.

## 3. Add the boundaries

Create `pages/_error.<ext>` and `pages/_not-found.<ext>`. Both receive an `error` prop `{ status, message }` (type `ErrorPageProps` from the adapter). A root `_not-found` also handles URLs that match no page or API route. Put one in a subdirectory to customize that section; Void uses the closest and keeps the surrounding layouts. Boundaries have no `.server` companion, no actions and no `layout` export.

Read [rendering-modes.md](rendering-modes.md) when the app uses `ssr = false`, island pages or `output: 'static'`.

Done when requesting a missing URL and a throwing loader each render the matching boundary inside the layout.

## 4. Defer slow, non-critical data

1. Wrap the slow part: `usage: defer(async () => fetchUsage())`. Return fast data beside it, un-deferred.
2. Give props that share one slow call a group name: `defer('analytics', resolver)` on each; the resolver runs once.
3. Read it by adapter:
   - React: `use(prop)` under `<Suspense>`. A rejection throws from `use()`, so wrap the Suspense boundary in a React error boundary when the page needs its own failure state.
   - Vue, Svelte, Solid: `{ loading, value, error }`. Test `loading` first, then `error`, then read `value`.
4. For a custom failure message throw an `HTTPException` from the resolver. In production any other error reaches the page as `Internal Server Error`.
5. An action does not refresh deferred props; they keep their last values until the next page load or client navigation. Keep data an action changes out of `defer()`, or redirect after the action.

Done when the page paints the fast props before the deferred one resolves, and a rejected resolver shows the failure state.

## 5. Handle failures outside page GET

`_error` and `HTTPException` rendering covers page GET and HEAD only. Actions and API routes keep their own handling: return `c.json()` or `c.text()` with a status, or show form errors (see `void-actions-and-forms`). Do not expect a boundary there.

## 6. Retry

In an interactive error component call `useRouter().refresh()` to re-run the loader; it never repeats a form submission. A link or document reload also works. Error responses are not cached by the client router.
