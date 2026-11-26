# Push and ad-hoc SQL

Read this before `void db push` or `void db execute`. For SQL against deployed data read `skills/void-database-remote-and-recovery/SKILL.md`.

## Push

`void db push` applies the Drizzle schema to the development database and writes no migration file. D1 updates the local database; PostgreSQL and MySQL use `DATABASE_URL` from `.env`.

- Use it for quick schema iteration while prototyping. Anything that will deploy goes through `void db generate`; a pushed schema with no migration makes `void deploy` stop.
- Destroys: columns or tables the new schema no longer has, in the development database. Confirm first that `DATABASE_URL` in `.env` is a local database.
- After `void gen model`, `push` applies the new table locally, or `generate` creates the migration.

Done when the local database matches the schema and the change you intend to ship has gone through `void db generate`.

## Ad-hoc SQL

`void db execute <sql>` or `void db execute --file <path>` runs SQL against the local database. A statement that returns rows prints a table; statements that change data print nothing; several statements run as a script with no printed results.

- Destroys: whatever the SQL changes. There is no undo; local data comes back only from a seed.
- `--remote` runs against the deployed database and has its own safety order: `skills/void-database-remote-and-recovery/SKILL.md`.
- Prefer this command over a separate client, so the same target resolution (`.env`, `.void/project.json`) applies.

Done when the printed rows or the follow-up `SELECT` show the intended change.
