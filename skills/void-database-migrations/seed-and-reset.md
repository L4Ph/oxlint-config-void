# Seed and reset local data

Read this before running `void db reset` or `void db seed`.

## Reset

`void db reset [--yes]` drops the development database's tables and re-applies every migration.

- Destroys: D1, the local data. PostgreSQL, tables, views, sequences and custom types in `public` (extensions stay; dependencies from other schemas must be resolved first). MySQL, all tables and views.
- Confirm first: for PostgreSQL and MySQL the target is `DATABASE_URL` from `.env`. Print only the host of that URL (never the password) and compare it with the deployment's; if the two match (for example after `void db connect`), reset drops the deployed tables. Change `.env` to a local database first.
- A `DATABASE_URL` host other than `localhost` makes Void name the database and ask. `--yes` skips the question; without a terminal (CI, scripts) the command stops unless `--yes` is set. Pass `--yes` only for a database you intend to drop.
- Need to keep data? Use `void db migrate` instead.

Done when the printed database name is the one you meant to drop.

## Seed

`void db seed [--file <path>] [--yes]` resets the local database exactly as `reset` does (same prompt, same `--yes`), re-applies migrations, then runs the seed file. Treat it as `reset` plus a load.

## Seed files

Without `--file`, Void looks in this order: `db/seed.ts`, `db/seed.mts`, `db/seed.js`, `db/seed.mjs`, `db/seed.sql`. With more than one present it stops and asks for `--file <path>`; keep one, or pass `--file`.

A programmatic seed default-exports a function, or exports a named `seed` function. `defineSeed` from `void/seed` types its context: `dialect` (`"sqlite"`, `"postgresql"`, `"mysql"`), `db` (Drizzle on the local database) and `schema` (the exports of `db/schema`). A `.sql` seed holds plain statements.

Done when `void db seed` ends without the "pass `--file`" stop and the seeded rows are present.
