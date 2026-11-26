# Custom migrations and renames

Read this when a migration needs SQL the schema cannot express, when numbering is old, or when SQL files exist without snapshots.

## Empty custom migration

`void gen migration <name>` writes an empty `db/migrations/<YYYYMMDDHHMMSS>_<name>.sql`. Let Void pick the prefix; do not number files by hand. Fill in the SQL, then follow the Review step of `SKILL.md` (statement breakpoints included). Done when the file exists and `void db migrate` applies it.

## SQL files without snapshots

Deploy compares the schema with the snapshots in `db/migrations/meta/`. SQL written by hand with no snapshot makes `void db generate` create a second migration for the same tables. The repair is in `skills/void-database-postgres-mysql/adopt-existing-drizzle.md`, section "Hand-written migrations".

## Numeric prefixes

Projects with `0001_name.sql` files rename them with `void db rename-migrations` (never by hand). Docs contradiction on who may run it:

- `reference/cli/generate.md`: existing numeric-prefix projects "can rename with `void db rename-migrations`".
- `reference/cli/database.md`: the command is for linked Void platform projects (sign in and `void project link` first) and updates local and remote migration records; direct Cloudflare projects keep existing filenames, and new timestamped files run after them.

On a Void platform project, run it after `void project link`. On direct Cloudflare, leave old names alone. Done when no file you intended to rename keeps a numeric prefix, or you recorded why a direct Cloudflare project keeps them.
