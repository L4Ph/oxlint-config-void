---
name: void-database-remote-and-recovery
description: Runs `void db` commands against deployed data and recovers from a bad migration. Use when inspecting or changing production data with `--remote`, when a migration broke production, when restoring a D1 database with Time Travel, or when taking a backup.
---

# Deployed data and recovery

Every `--remote` command acts on the target saved in `.void/project.json`, not on what you last typed. Rollback of code never reverses a migration. Lint cannot see targets, so this skill holds the order.

## 1. Pin the target before any `--remote` command

1. Print `.void/project.json`: which project and platform (Void platform, or direct Cloudflare) and which database.
2. PostgreSQL or MySQL on direct Cloudflare: `--remote` needs `DATABASE_URL` in the current shell, because Cloudflare cannot return the Hyperdrive password. Export it in that shell only (never into the repo). Per-target requirements for every command are in `targets.md`.
3. A one-off Cloudflare deployment takes `--platform cloudflare` on restore, rollback and deploy alike.
4. Done when you can state in one line the platform, the database and who owns it.

## 2. Look before you write

- `void db status` lists applied and pending migrations locally and on the saved target; read it first.
- D1: query with `void db execute --remote "SELECT ..."`. `void db studio --remote` does not apply to D1.
- PostgreSQL and MySQL: `void db studio --remote`. On a hosted project run `void db set-url` first if no URL is stored.
- Done when you have seen the rows or migrations you are about to change.

## 3. Change deployed data or schema

`void db execute --remote <sql> [--yes]` runs SQL on the deployed database. **Destroys:** whatever the SQL deletes, updates or drops, with no undo (D1 Time Travel rewinds the whole database, section 4). Confirm first: the target from section 1, a `SELECT` with the same `WHERE`, a restore bookmark (section 4) or backup (section 6).

- A destructive statement (`DELETE`, `UPDATE`, `DROP`, ...) prompts in a terminal. Non-TTY runs (CI) never prompt and `--yes` changes nothing there: check the statement before the job runs. Pass `--yes` in a terminal only for a statement you checked.
- A `--file` over 100 KB on a direct Cloudflare D1 database runs as a D1 import: Void waits, the database serves no queries until it finishes, and no rows print. A terminal asks before any D1 import. Split the file under 100 KB for a live database.
- `void db migrate --remote` applies pending migrations to the saved target. Hosted projects need a Void login and link; direct D1 projects use the binding's migration directory, table and pattern, and the binding must set `migrations_dir`; direct PostgreSQL and MySQL use the shell `DATABASE_URL`. Normally let `void deploy` apply them.
- Done when the follow-up `SELECT` shows the intended state.

## 4. Roll back a bad migration (D1 on direct Cloudflare)

Before applying migrations, `void deploy` saves a Time Travel restore point and prints a `void db restore` command with its bookmark. Keep that output.

Order matters:

1. If the live code needs the newer schema, roll the code back first: `void project rollback [deployId]` (Cloudflare: a complete Worker Version ID or unambiguous prefix). Void asks to confirm when the earlier code may not fit the current schema.
2. Restore the database: `void db restore --bookmark <bookmark>`, or `--timestamp <ISO-8601 with timezone>` such as `2026-10-16T09:30:00Z`.
3. Fix or remove the failed migration, then deploy. The restore rewinds migration history, so the next deploy re-applies the pending files.

`void db restore` **destroys every write made after the restore point**, not only the migration's effects. Void asks for confirmation and prints a command that undoes the restore; `--yes` skips the question in scripts and CI. Confirm first: the bookmark is the one printed before this migration, and you accept losing writes since then. Time Travel keeps 7 days on Workers Free and 30 days on Workers Paid; for older changes write a new migration that reverses them.

After a restore, check that the deployed code works with the restored schema. Done when the app answers a request that touches the changed tables and `void db status` lists the pending files you expect.

Other targets: `void db restore` is D1-on-direct-Cloudflare only. The docs describe no Void restore for PostgreSQL or MySQL; use your provider's backups (section 6) and `targets.md`.

## 5. Skipped migrations

After `void deploy --skip-migrations`, direct Cloudflare history shows the applied migration state as unknown; the next deploy without the flag applies what is pending.

## 6. Back up

- `void db export [--output <path>] [--no-data] [--no-schema] [--table <name>]` dumps only the local database (stdout or a file). It is not a production backup.
- PostgreSQL with views, triggers, custom types, functions or standalone sequences: take the complete backup with `pg_dump`; `void db export` reports those objects before writing.
- D1 production: the Time Travel bookmark of section 4.
- Done when the backup file or bookmark exists before you run section 3.
