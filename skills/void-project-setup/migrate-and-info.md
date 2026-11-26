# void migrate and void info

Read when the project has `void.json` or a root `wrangler.jsonc` / `wrangler.json`, or before moving the file of a Durable State, Room or WebSocket definition.

## Convert legacy config with void migrate

`void migrate` turns legacy `void.json` and root `wrangler.jsonc` / `wrangler.json` (also one root `wrangler*.json(c)` that a supported framework adapter references) into `void.config.ts`. It saves backups in `.void/config-migration/`, records resource IDs in `void.lock.json`, points supported adapters at Void's generated Cloudflare config, and adds `.cloudflare/` and `.void-wrangler.jsonc` to `.gitignore`. It changes local files only. `void init` and `void deploy` run the same conversion on their own.

Before running: resolve conflicting Cloudflare configs, and make the project's `void` package and the CLI the same version.

Done when `void.config.ts` exists, the backups are under `.void/config-migration/`, and `void.config.ts`, `void.lock.json` and `.gitignore` are reviewed and committed.

## Keep a persistent resource name with void info

`void info [--json]` is local and read-only: no sign-in, network or file generation. It lists each Durable State and WebSocket definition's source file, name (inferred or explicit), Worker class and binding. The persistent resource is keyed by that name, and the inferred name follows the file.

1. Before moving a deployed definition, run `void info` and copy its `name` into `defineDurableState()`, `defineRoom()` or `defineWebSocket()`.
2. Move the file, run `void info` again, and check the name is unchanged.
3. Entries under recorded resources are in `void.lock.json` with no matching definition. Adopt a suggested name only after you identify the resource you moved. When no name is suggested, restore the original source and inspect it before moving again.

Done when `void info` after the move shows the same `name` with `nameSource: explicit`. See `guide/durable-state.md` and `guide/websockets.md` in the bundled docs for the full flows, including WebSocket parameter renames.
