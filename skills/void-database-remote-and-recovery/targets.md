# Per-target requirements for `void db` commands

Read this when a command targets PostgreSQL or MySQL, a hosted Void platform project, or a direct Cloudflare deployment, or when `void db connect` or `void db set-url` is involved.

## `--remote` by target

| Target                                | `execute --remote`                                                                       | `studio --remote`                                            | `migrate --remote` / `status`                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- |
| Void platform, D1                     | routed through the platform's registered proxy with your auth token                      | not applicable: use `execute --remote`                       | Void login and link                               |
| Direct Cloudflare, D1                 | invokes Cloudflare against the D1 binding pinned in `void.config.ts` or `void.lock.json` | not applicable                                               | the binding's `migrations_dir`, table and pattern |
| Hosted PostgreSQL or MySQL            | fetches the stored connection string from the platform                                   | the same stored string (run `void db set-url` first if none) | Void login and link                               |
| Direct Cloudflare PostgreSQL or MySQL | `DATABASE_URL` from the current shell                                                    | `DATABASE_URL` from the current shell                        | `DATABASE_URL` from the current shell             |

## Connection strings

- `void db connect '<url>'` (or `--provider neon|<adapter>`) saves `DATABASE_URL` in `.env`; keep `.env` uncommitted. With a linked Void project it also updates the encrypted deployment URL; `--local-only` skips that sync. Provider-created credentials are never printed. For a direct Cloudflare deploy, also set the same URL as a protected secret in the shell or CI that runs deploy.
- `void db set-url` (projects with `database` `pg` or `mysql`) prompts for a string and sends it to the platform API to create or update the Hyperdrive configuration. Changes remote state: confirm the new string points at the intended database. Details: `skills/void-database-postgres-mysql/SKILL.md`.

## Renames

`void db rename-migrations` is for linked Void platform projects only; direct Cloudflare keeps existing filenames. See `skills/void-database-migrations/custom-migrations.md`.
