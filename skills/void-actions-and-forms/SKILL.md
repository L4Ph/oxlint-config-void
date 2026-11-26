---
name: void-actions-and-forms
description: "Writes Void page actions and their forms: action and actions exports, useForm, action(), validation errors, redirects after a change, shared-data refresh, uploads. Use when adding a form or button mutation, handling a failed submit, uploading a file, or when layout data stays stale after an action."
---

# Void actions and forms

A page action changes server data from a form or button. It lives in the page's `.server` file, accepts POST, PUT, PATCH and DELETE, and is built with `defineHandler` like a loader. Lint covers validator and `fetch` bans, error narrowing and option placement (families `forms-actions`, `handlers`); this skill covers the flow.

## 1. Write the action

1. Export `action` from the `.server` file with `defineHandler.withValidator({ body: schema })(async (c, { body }) => ...)`. A page that needs several mutations exports `actions` instead (never both).
2. Return nothing to re-run the loader and re-render with fresh props, or return `c.redirect(path)` to go to another page.
3. Name each handler in `actions`: `actions: { update, delete }`. Callers address them with a suffix: `/users/42?update`. `actions.default` runs for a bare POST. `useForm` and `action()` add the suffix from the URL you pass.

Done when a submit re-renders the page with the new data.

## 2. Pick the client primitive

| Need | Use |
| --- | --- |
| Form fields, field errors, pending flag | `useForm(url, defaults, options)` with `Form` |
| One button or awaitable mutation, no form state | `action(url, { params, data, method })`; returns `{ ok, error }` or `{ ok: true, pageData }` |

- Client-side checks: `form.setError(field, message)`; editing the field clears it.
- A create form that should clear after saving: pass `resetOnSuccess: true` as the third argument.
- Dynamic route: pass `{ params: { id } }`; named action: `useForm('/users/[id]?update', ...)`.
- React `form.post` is a native form action; Vue, Svelte and Solid return `Promise<void>`, so `await` it inside try/catch. React callbacks (`onSuccess`, `onError`) run before commit; use an effect to focus something new.
- Forms inside island components use `useIslandForm` (see `void-island-and-markdown-pages`).

Done when a failed validation shows the field message and keeps the inputs editable.

## 3. Refresh shared data or redirect

Middleware does not run again after an action. When the action changes data the layout shows through `shared` (the signed-in user, for example), either:

- update it in the action: `c.set('shared', { ...c.get('shared'), auth: { user } })` (spread the old value), or
- `return c.redirect(path)`, which loads the destination and shared data again.

Query strings: `useForm` and `action()` carry the current page's query into the action, and the loader sees it. A redirect from the action does not carry that page query, so `return c.redirect('/items')` clears `?page=2&search=foo`. An ordinary query on the named-action URL (`/users/42?update&tab=profile`) survives a default redirect or re-render as `?tab=profile`, with the action key removed. A method-preserving redirect (307, 308) keeps the key.

Done when the layout shows the new value after the action, and the URL holds exactly the query you intend.

## 4. Handle failures

- `400`, `404`, `409`, `422`, `429` stay with the form: `form.errors` or `form.error`; `action()` returns `{ ok: false, error }`.
- `401`, `403`, `500`, `502` throw by default. Catch them in the framework's error boundary, or pass `throwOnError: false` to put them in `form.error`.
- Use `isVoidActionError(e)` before reading `e.status` or `e.message`; `isCallSiteActionError` matches only the errors `action()` returns.
- For custom checks throw `new ValidationError({ email: 'Email already taken' })` (from `void/handler`); it fills `form.errors`.
- A `UsageLimit` from AI or Sandbox calls becomes a structured 429 on its own. To change the message, catch it with `instanceof UsageLimit` and return `error.response({ message })`. `Form` waits for the retry deadline and never retries by itself.
- A rejected action never renders `_error` (see `void-loaders-and-errors`).

## 5. Authorize inside the action

Void rejects cross-origin browser submissions with `403 Forbidden`; the page and its action must share scheme, host and port. Server clients carry no origin headers and can still call the action, so every action that touches protected data checks authentication and authorization itself.

Done when a request without a session gets 401 or 403 from the action.

## 6. Uploads

Read [uploads.md](uploads.md) when the form sends a `File`, `Blob` or `FileList`.
