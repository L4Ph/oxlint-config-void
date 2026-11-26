# Navigation details

Read when a task touches active or pending link styling, Vue state across navigation, `await router.visit()` timing in React, or view transitions.

## Active and pending links

`Link` sets `aria-current="page"` and `data-void-active` on the link to the current page.

| Current URL | `href="/users"` | with `activeMatch="prefix"` |
| --- | --- | --- |
| `/users`, `/users?page=2` | both attributes | both attributes |
| `/users/42` | none | `data-void-active` only |
| `/users-admin` | none | none |

- A link is active when the current URL holds all of the link's query parameters with equal values; extra parameters and order do not matter, and a GET link's `data` counts as query. `/posts?page=2` does not activate `href="/posts?page=1"`.
- `activeMatch="prefix"` compares only the path. Paths are case-sensitive and respect trailing slashes; hashes are ignored; external and non-GET links are never active.
- `data-void-pending` marks every link whose path, query and hash match the destination while it loads (non-GET links also match the method). During `router.refresh()`, links to the current page are pending. A `data-void-pending` prop you pass replaces the computed value.

## Vue state on navigation

Vue GET navigation remounts the page, so `useForm()` takes the destination record's URL and defaults; layouts persist. Mutations and `router.refresh()` keep page state. To change that within one record, set `preserveState` explicitly.

## React: await router.visit()

`await router.visit()` and `await router.refresh()` wait for React to commit. Inside `startTransition`, a `<form action>`, `useActionState` or an async `useForm` callback, pass `{ resolveOn: 'data' }`. The promise then resolves when data is ready, before the commit, so the DOM and URL may still show the old page after the `await`. Do DOM-dependent work (focus, scroll) in an effect or ref callback.

## View transitions

1. Pass `viewTransitions: true` to the adapter plugin in `vite.config.ts` (plural `viewTransitions`). The per-link prop and the `router.visit` option are singular `viewTransition`.
2. The default is a cross-fade. Change it with `::view-transition-old(root)` and `::view-transition-new(root)` rules.
3. Give elements that should animate on their own, such as a hero image, a `view-transition-name`.

Browsers without the API navigate instantly with no error. Done when a navigation in a supporting browser animates and one in another browser still completes.
