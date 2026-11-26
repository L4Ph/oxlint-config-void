---
name: void-database-d1-replication
description: Designs D1 read consistency in a Void app. Use when a read must see a recent write, when stale reads appear after a save or redirect, when carrying a D1 bookmark across requests, or when read replication should be switched on or off.
---

# D1 replication and read consistency

Void's `db` from `void/db` reads through one D1 session per request. With replication on, a read can run on a replica; later queries in that request see at least what earlier ones saw. Between requests a replica can lag. The jobs below say how to get fresh data anyway.

D1 only. PostgreSQL and MySQL have no sessions or bookmarks. Lint holds the config literals and call placement (`database` and `config` rule families); this skill holds the design.

## 1. Set replication on or off, explicitly

`database.readReplication` in `void.config.ts` is `true`, `false`, or omitted. Omitted leaves the database's current setting alone: new databases start off, and an existing database that already has replicas keeps them.

- Void 0.21.3 turned replication on automatically before it became opt-in. An app deployed in that window may have replicas without knowing. Unless the app carries bookmarks as below, set `readReplication: false` and run `void deploy`. Upgrading Void or deleting the option does not turn replication off.
- A self-hosted platform must be upgraded too: a platform that cannot apply the option makes `void deploy` stop with an error before uploading anything.
- Done when `void.config.ts` states the value you want and the deploy applied it.

## 2. Pick the tool for each read

| Need                                                                     | Use                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Later queries in the same request see earlier ones                       | nothing; the request session does it                                                 |
| Latest primary data for one read (a permission check, a post-write read) | `createDb(env.DB, { session: 'first-primary' })`, created inside the request         |
| A read in a later request sees an earlier save                           | carry a bookmark: `bookmark-transports.md`                                           |
| The page after a redirect must be fresh                                  | a primary-first session on the destination (cookies can be overwritten out of order) |
| Another D1 binding                                                       | `createDb(env.MY_OTHER_DB)`                                                          |

`'first-unconstrained'` is the default and lets the first query use a replica. Authentication checks already use the primary. Done when each consistency-critical read matches a row of this table.

## 3. Follow the session rules

- `setSession()` and the no-argument `getBookmark()` need Void's request scope: call them from middleware, before the first use of `db` and before `await next()`. Inside a framework-owned endpoint (an Astro API route) there is no request scope, so build an explicit `createDb(binding, { session })` client and read `getBookmark(client)` from it. Without request scope each operation starts on the primary.
- The session opens when `db` is first read, even when only a method is extracted or `$client` touched. After that a newer bookmark, or switching to `'first-primary'`, throws. Configure first, or use `createDb(binding, { session })` for an independent session.
- Repeating a requirement the session already meets is safe (middleware running twice on a local server-side fetch); `'first-unconstrained'` never overrides an earlier bookmark or primary-first setting.
- A request with no incoming bookmark passes `'first-unconstrained'` to `setSession`; wrap a bookmark string as `{ bookmark }`, including one from `getBookmark()`.
- Await every consistency-critical query before reading the bookmark you return. A deferred or background query that finishes later is not reflected in it.
- Done when no `setSession` call can run after `db` is touched and no bookmark is read before its queries are awaited.

## 4. Handle bookmarks as sealed values

- Opaque: never parse or build one.
- Scoped: one per database and environment. Use separate cookie names or storage keys per database and environment, and clear saved bookmarks when switching databases. Clearing starts a new chain with no earlier guarantee.
- Newest wins: bookmarks sort lexicographically; an older response must not replace a newer bookmark of the same database.
- Done when each storage key or cookie name carries its database and environment.

## 5. Carry the bookmark

Read `bookmark-transports.md` when a read after a save in another request must be consistent: it covers the cookie recipe, the header recipe with the fetch wrapper, running both, and the ISR rule. Done when a save followed by a read through the same transport sees the save.

## 6. Other query layers and batches

- `db.batch([...])` sends several D1 statements in one round trip.
- Raw D1 or another library (Kysely): `env` from `cloudflare:workers`, binding `env.DB`. A bare D1 binding reads from the primary; call `withSession()` on it to use replicas. Nuxt and SvelteKit 2 cannot import `cloudflare:workers` in local development; use `void/db` or the framework's binding access (SvelteKit 3 can).
