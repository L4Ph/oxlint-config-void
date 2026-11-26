# Error boundaries by rendering mode

Read when the app uses `ssr = false`, island pages, `output: 'static'`, or a layout that fails.

## Where boundaries render

- `ssr = false`: the boundary renders in the browser.
- Island pages: errors render on the server, with no client router. Event handlers, detached async tasks and independent islands keep the framework's usual error handling.
- Boundaries get the shared context of the page they replace.
- If a layout fails, a boundary outside that layout handles it. If a boundary fails, Void tries an outer one, then its built-in page.
- `.dev` and `.prod` variants of a boundary work like any page. `/error` and `/not-found` stay free for ordinary pages.

## output: 'static'

A root `_not-found` becomes `404.html` unless you supply one. It renders at build time with empty shared data and params, without request middleware or hydration. Keep it and its layouts usable without a signed-in user. The static host, not Void, sets the 404 status for unknown URLs.

Done when `404.html` exists in `dist/client/` and the page renders without a session.
