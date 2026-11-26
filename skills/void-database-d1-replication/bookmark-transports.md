# Carrying a D1 bookmark between requests

Read this when a read in one request must see a save from an earlier request. The code for each recipe is in `node_modules/void/docs/guide/database/d1.md`, section "See your writes in subsequent requests"; copy it from there and adapt the path list. This file holds the choice and the traps.

## Choose the transport

| Transport | Carries through | Weakness |
| --- | --- | --- |
| Cookie `db-bookmark` (middleware sets it after `next()`) | navigation, redirects, forms, same-origin fetch | concurrent responses can overwrite it with an older bookmark |
| Header `X-DB-Bookmark` plus the browser fetch wrapper | API requests made through the wrapper only | not sent by navigation, forms or Pages requests; shares nothing with the cookie recipe |
| Both, in one middleware | everything above | needs the wrapper for every participating API request |

Concurrent API clients: use the header recipe, which keeps the newest bookmark across out-of-order responses. A page reached by redirect that must be fresh: add a primary-first session on that page; the cookie alone does not guarantee it.

## Rules every recipe shares

1. One middleware file (`middleware/01.database.ts` in the docs) holds the logic. With both transports it is one middleware that takes the newest incoming bookmark of the two (sort, take the last) and returns it through both.
2. The participating path list covers every read, save and redirect destination of the flow. Paths outside it keep their cache policy. Participating responses get `Cache-Control: private, no-store`.
3. Disable ISR on each participating page: `export const revalidate = 0` in its `.server.ts`. Response headers do not bypass an ISR cache hit, so a cached page can predate the save without running a query.
4. Participating API endpoints return data, not redirects (the wrapper uses `redirect: 'error'`).
5. The fetch wrapper needs HTTPS or localhost, browser storage and Web Locks. Scope it per database and signed-in account (`createBookmarkFetch('app-db:<accountId>')`); same-origin tabs with one scope share progress. Use it for every participating API request, and let it keep the newest returned bookmark under a lock.
6. For a framework-owned endpoint, read the incoming `X-DB-Bookmark`, pass `{ bookmark }` to `createDb`, and return `getBookmark(client)` in the response header.

## Done when

- The save and the following read go through the same transport and the read returns the saved row.
- Every participating page sets `revalidate = 0` and the middleware path list names it.
