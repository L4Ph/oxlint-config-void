---
name: void-database-migrations
description: Changes a Void app's database schema and ships it as reviewed SQL. Use when adding, changing or removing a table or column; when `void deploy` stops on a schema change without a migration; when generated SQL needs a hand edit; when seeding or resetting local data.
---

# Change the schema and ship the migration

`db/schema.ts` (or `db/schema/*.ts` re-exported from it) is the source of truth. The SQL in `db/migrations/` is generated from it.

## Edit the schema

1. Edit the tables with the helpers from `void/schema-d1`, `void/schema-pg` or `void/schema-mysql`. For a new table with list, create and get-by-id routes run `void gen model <name> [name:type ...]` (`name:type?` is nullable; types `string text datetime integer boolean real blob`; the name is lowercase alphanumeric plus `_`).
   - `gen model` writes `db/schema/<name>.ts` (with `id`, `createdAt`, `updatedAt`), an export from `db/schema.ts`, `routes/api/<name>/index.ts` and `routes/api/<name>/[id].ts`, and regenerates `.void/`. It never overwrites a file, so edit the generated files instead of running it again. It picks valibot, zod or arktype from `package.json` and asks when it finds none.
   - A schema file that imports zod, valibot or arktype directly needs that package installed.
   - Do not define Void's auth tables here. `void db generate` emits them (and the tables of configured auth plugins) on its own.
2. Column names: a column declared without a name (`createdAt: timestamp()`) is stored under its key. `database.casing: 'snake_case'` stores it as `created_at`. After changing `casing` on a database that has tables, run the Generate step and read that migration before applying it.
3. Done when the schema file exports every table you meant to add or change.

For an empty migration you fill in yourself (data backfill, SQL the schema cannot express), read `custom-migrations.md`.

## Generate

1. Run `void db generate`. It compares the schema with the last Drizzle snapshot and writes SQL, snapshot and journal under `db/migrations/`. Use it instead of `void db push` for anything that will be deployed: `push` writes no migration file.
2. SQLite (D1) only: Void also applies the whole history to a fresh database. If that fails, Void restores the previous SQL, snapshots and journal. Fix the cause and rerun. When the failing file is an existing unapplied migration, repair that SQL file first; rerunning compares snapshots and does not repair SQL.
3. Done when the command exits 0 and `git status` shows the new `.sql` file plus changed snapshot and journal files.

## Review the SQL

The fresh-database check does not prove a migration keeps existing rows. Read every new statement and check:

- `DROP TABLE`, table rebuilds and foreign-key actions (`ON DELETE ...`): each can delete rows. Reshape the schema change or write the data move into the migration.
- Renamed columns after a `casing` change: confirm the SQL renames and does not drop and re-add.
- Triggers on D1, and triggers, procedures, functions or events on MySQL: a `--> statement-breakpoint` line goes after each complete statement, including the trigger's closing `END;`. Keep each trigger body in one piece between breakpoints.
- Auth tables in the output: expected, keep them.

Done when each statement is either intended or removed by changing the schema and regenerating, and every trigger statement is followed by a breakpoint line.

## Apply locally

1. Run `void db migrate`. It applies only pending migrations and keeps local data. (`void db reset` drops data; see below.)
2. With `voidPlugin({ persistTo: 'local-state' })`, start the dev server once before any `void db` command and again after changing the Vite config, so the CLI finds the data directory.
3. On PostgreSQL and MySQL the local commands act on `DATABASE_URL` from `.env`.
4. Done when `void db status` lists nothing pending.

Docs contradiction: the CLI reference says `void db status` shows applied and pending migrations (locally and on the saved target); `guide/database.md` lists it as the check for "schema drift and pending migrations". It reliably tells you what is pending. For drift, run `void db generate` after a clean `status`: a new file means the schema changed without a migration.

## Commit and deploy

1. Commit the SQL, the snapshots and the journal together.
2. `void deploy` applies pending migrations before the new version goes live. It stops when the schema has changes without a migration: run `void db generate`, review, commit, deploy again.
3. Direct Cloudflare deploys need the auth tables in checked-in migrations, so run `void db generate` and commit its SQL. Void platforms create auth tables themselves; generating still emits them.
4. Migrations run in a separate release step, or a preview shares the database: `void deploy --skip-migrations`. The code must work with the database's current schema; the next deploy without the flag applies the pending files.
5. A rollback of code does not reverse a migration. To recover from a bad migration read `skills/void-database-remote-and-recovery/SKILL.md`.
6. Done when the deploy output reports no schema-drift stop and `void db status` lists nothing pending on the saved target.

## Commands that destroy local data

Each of these acts on the database named by `.env` for PostgreSQL and MySQL. If that `DATABASE_URL` is the deployment's (for example after `void db connect`), the command acts on deployed data. Print the host of `DATABASE_URL` before running one.

| Command | Destroys | Read |
| --- | --- | --- |
| `void db reset [--yes]` | every table (PostgreSQL: tables, views, sequences, custom types of `public`; MySQL: tables and views), then re-applies migrations | `seed-and-reset.md` |
| `void db seed [--file <path>] [--yes]` | everything `reset` destroys, then runs the seed file | `seed-and-reset.md` |
| `void db push` | rewrites the dev schema to match the code without a migration record | `push-and-execute.md` |
| `void db execute <sql>` | whatever the SQL changes | `push-and-execute.md` |

Lint companion: the `database` rule family holds file shapes (`rules/plan.json`); this skill holds the order and the review.
