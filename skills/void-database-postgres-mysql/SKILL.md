---
name: void-database-postgres-mysql
description: Connects a Void app to PostgreSQL or MySQL through Hyperdrive. Use when choosing an external database, setting or changing DATABASE_URL or the deployed connection string, adopting an existing Drizzle PostgreSQL database, repairing a MySQL migration that failed halfway, or hand-writing SQL migrations.
---

# PostgreSQL and MySQL

External databases are bring-your-own. The schema, queries and `void db` workflow match D1 (`skills/void-database-migrations/SKILL.md`); what differs is the connection and a few failure behaviors. Lint holds the config literals (`config` rule family).

## 1. Choose the dialect

Set `database` in `void.config.ts`: `"pg"` or `"mysql"`. The docs write it two ways: the string shorthand (`"database": "pg"`, in the database guides and the Postgres adoption steps) and the object form (`database: { dialect: 'pg', casing: 'snake_case' }`, in the config reference and casing example). The object form is required to set `casing`; omit `dialect` for D1. Import schema helpers from `void/schema-pg` or `void/schema-mysql`; `void gen model` then emits matching builders.

Done when `void gen model` or a schema file imports from the helper module of the chosen dialect.

## 2. Connect locally

Put `DATABASE_URL` in `.env` (keep `.env` out of git). Local dev and every local `void db` command use it directly, with no Hyperdrive. `void db connect '<url>'` writes it for you; with a linked Void project it also updates the encrypted deployment URL, unless `--local-only`. Provider-created credentials are never printed.

Hazard: if `.env` holds the deployment's URL, `void db reset` and `void db seed` drop deployed tables (`skills/void-database-migrations/seed-and-reset.md`). Done when the host in `DATABASE_URL` is the database you mean to change.

## 3. Connect production

Production reaches the database through a Hyperdrive that Void provisions from the connection string. The string is not written to project config.

| Deploy target | How the URL gets there |
| --- | --- |
| Void platform | `void deploy` prompts for it, or run `void db set-url` |
| Direct Cloudflare (`--platform cloudflare`) | export `DATABASE_URL` in the shell or CI step that runs `void deploy`; in CI make it a protected secret |

- Direct Cloudflare also needs an API token with Hyperdrive edit permission for the first provisioning. Alternative: create the Hyperdrive in Cloudflare and put its ID in `cloudflare.hyperdrive`; an existing binding works with a browser login.
- `postgres://` and `postgresql://` are both accepted, with provider query strings such as `?sslmode=require`.
- TLS: the Hyperdrive Void creates uses Cloudflare's `require` mode and ignores `sslmode=verify-ca`, `sslmode=verify-full` and `sslrootcert`. To verify against a certificate authority on direct Cloudflare, create the Hyperdrive in Cloudflare with that certificate and add its ID to `cloudflare.hyperdrive`.
- Done when `void deploy` provisions Hyperdrive and applies pending migrations without a missing-URL error.

### Change the deployed connection string

Run `void db set-url` for a linked project after, say, moving the database host. Only projects with `database` `pg` or `mysql` have it. It prompts for the string and sends it to the platform API, which creates or updates the Hyperdrive configuration. Changes remote state; destroys nothing, but every later deploy and `--remote` command uses the new target, so confirm the new URL points at the intended database first. Done when `void db status` run against the saved target lists the applied migrations of the new database.

## 4. Run migrations

`void db generate`, `void db migrate`, `void db status`, then `void deploy` (which applies pending migrations before going live).

- PostgreSQL wraps each migration in `BEGIN` and `COMMIT`: a failure rolls the whole file back.
- MySQL does not: read `mysql-failed-migrations.md` before writing or rerunning a MySQL migration.
- Only one migration run changes a database at a time (see the same file).
- Local commands use `DATABASE_URL` from `.env`; `--remote` execution and Studio use the encrypted URL stored for a linked Void project, or the shell `DATABASE_URL` on direct Cloudflare (`skills/void-database-remote-and-recovery/targets.md`).

## 5. Adopt existing history

Read `adopt-existing-drizzle.md` when the PostgreSQL database already has Drizzle migrations applied (before the first Void deployment), or when SQL migration files exist without `db/migrations/meta/` snapshots.
