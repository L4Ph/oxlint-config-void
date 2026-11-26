# Adopting Drizzle history and hand-written migrations

Read this when a PostgreSQL database already migrated by Drizzle is moving to Void, or when SQL migration files lack snapshots (any dialect).

## Adopt an existing Drizzle PostgreSQL database

Do this before the first Void deployment, once per database (development and production can have different histories).

1. Back up the database and pause deployments. Rehearse the whole procedure on a restored copy first.
2. Set `database: 'pg'` in `void.config.ts`. Keep the schema, the SQL filenames and `db/migrations/meta/`. Do not regenerate or rename migrations.
3. Read Drizzle's history: `SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;` (use your configured schema and table if different). Match each `created_at` to `when` in `meta/_journal.json` and each `hash` to the SHA-256 of the SQL file. Resolve every difference before going on.
4. Write `adopt-void.sql`: `BEGIN;`, `CREATE TABLE IF NOT EXISTS _void_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);`, one `INSERT INTO _void_migrations (name, applied_at) VALUES ('<file>.sql', CURRENT_TIMESTAMP::text), ...` with `ON CONFLICT (name) DO NOTHING;`, `COMMIT;`. List only migrations you verified as applied, filenames including `.sql`. Leave pending ones out. (The exact file is in `node_modules/void/docs/guide/database.md`, "Adopt an existing Drizzle PostgreSQL database".)
5. Run it with a PostgreSQL client against the database and search path Void will use, stopping on errors. It records filenames only: it runs none of the SQL and leaves Drizzle's history alone.
6. Connect Void (`DATABASE_URL`; on direct Cloudflare set it in the shell or CI that runs `void deploy`) and run `void db status`.

Done when `void db status` lists only migrations that are really new. Keep Drizzle's history table; create future migrations with Void.

## Hand-written migrations

Deploy compares the Drizzle schema with the snapshots in `db/migrations/meta/`. SQL files with no such metadata make `void db generate` emit a second migration for the same tables. To keep an existing history:

1. Make the Drizzle schema match the tables your SQL creates.
2. In a scratch copy of the project (outside the repo), delete `db/migrations/` and run `void db generate`.
3. Copy the generated `meta/` into the real migration directory. In `_journal.json` replace `entries` with one entry per existing SQL file, in order: `idx` consecutive from `0`; `tag` the file name without `.sql`; `when` increasing timestamps; `version` from the generated entry; `breakpoints` true when the file uses `--> statement-breakpoint`.
4. Rename the generated snapshot to `<prefix>_snapshot.json`, where `<prefix>` is the part of the last migration tag before its first `_` (`001_create_users.sql` gives `001_snapshot.json`).
5. Review and commit the metadata, then deploy again.

If no database has applied the SQL yet, replace it with migrations from `void db generate` instead.

Done when `void db generate` writes no new migration for the unchanged schema.
