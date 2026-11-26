# MySQL migrations: one runner, partial failures

Read this when writing a MySQL migration, when a MySQL migration run failed, or when a run reports it is waiting.

## One runner at a time

Only one migration run changes a database at a time, whether it comes from `void db migrate`, `void db reset`, the reset inside `void db seed`, `void deploy --platform cloudflare`, or a `void deploy` of any project using that database. Better Auth's table changes run inside the same run. A competing run waits (about 20 seconds for a command that connects with `DATABASE_URL`, about 2 minutes for a deploy to the Void platform), then stops with an error asking you to try again. Done when you retry after the other run ends.

## A failed file leaves its early statements applied

Each migration file runs in a transaction, but MySQL commits `CREATE TABLE` and `ALTER TABLE` immediately. A file with schema changes that fails partway keeps its earlier statements applied. A file that only changes data is rolled back. On a sharded Vitess keyspace (such as a sharded PlanetScale database), a commit that fails on one shard does not undo the shards that already committed. The error names the failing file.

Recover in this order:

1. Read the failing file; list the statements before the failure that took effect.
2. Undo each applied statement. Local: `void db execute "DROP TABLE comments"`. Deployed: `void db execute --remote "DROP TABLE comments"` (destroys what the statement drops; read `skills/void-database-remote-and-recovery/SKILL.md` first).
3. Fix the file.
4. Run `void db migrate` or `void deploy` again.

Done when the rerun applies the file and `void db status` lists nothing pending.

## Writing for this behavior

- MySQL rejects `IF NOT EXISTS` on `ADD COLUMN` and `CREATE INDEX`, so a statement cannot be made safe to rerun; undoing it is the way back.
- Keep migrations small: fewer statements to undo.
- Triggers, procedures, functions and events need a `--> statement-breakpoint` line after each complete statement.
