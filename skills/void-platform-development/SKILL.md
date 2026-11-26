---
name: void-platform-development
description: Develops, tests and releases the Void platform from source - local setup with Vite+, PostgreSQL and the admin API, schema migrations and compatibility, source-built runtimes deployed with `--runtime`, GitHub webhook ingress, CI refs. Use when contributing to the platform, running a fork, or deploying a custom platform build.
---

# Develop the Void platform from source

**[REMOTE]** marks a command that changes Cloudflare or the platform; **[IRREVERSIBLE]** marks what cannot be undone. Run every command from the repository root.

## Before you start

- Work on the operator's fork checkout. Commands that touch a Cloudflare installation (steps 5 and 6) run only when the operator asked for that deployment in this conversation. Otherwise stay in local steps 1 to 4.
- Use the Node.js version in `.node-version`. Done when `node --version` matches it.

## 1. Set up the repository

```sh
vp install
vpr install:void-dev
void-dev --help
```

`install:void-dev` builds the CLI, shared packages and platform runtime, and makes this checkout's CLI available globally as `void-dev`. It refuses to replace an unrelated global command and says so; resolve that yourself. Public packages export built files: after later source changes run `vp run build:core` to refresh the alias. `vpr uninstall:void-dev` removes only this checkout's alias. Source map: `packages/void` (framework, runtime, CLI), `packages/platform` (installer contracts, Workers, migrations), `platform/packages/{api,dispatch,proxy,email-gateway,tail,dashboard}`.

The core installer creates the API, dispatch, proxy, tail and email gateway Workers only. The dashboard and managed GitHub builds exist in source but are not in that install; adding one needs its infrastructure, bindings, authentication and capability configuration together.

Done when `void-dev --help` prints.

## 2. Run the API and dashboard locally

1. Start a local PostgreSQL server with `psql` and `pg_isready` on your path.
2. ```sh
   vp run --filter @voidcloud/api setup --admin-email dev@example.com
   vp run --filter @voidcloud/api dev:admin
   ```
   Open `http://localhost:8787/admin/`. Setup writes the local database connection and a development authentication bypass to `platform/packages/api/.dev.vars`, and `platform/packages/dashboard/.env` for the dashboard. Both are Git-ignored: keep them local and never reuse them for production. The bypass covers only the browser admin UI; operator CLI sessions still need administrator authentication.
3. Docker is needed only to develop managed builds (run the API with containers enabled); the default `dev:admin` disables the build containers.
4. Dashboard, in another terminal: `vp run --filter @voidcloud/dashboard dev`, then **Dev login (local API)**. To point it at an Access-protected API you operate, install `cloudflared` and set `API_URL` and `CF_ACCESS_APP_URL` to matching origins. A deployed dashboard binds its `API` service to the platform API, sets `DASHBOARD_URL` on both, and its origin must be inside the platform's Access protection application.

Done when `/admin/` loads with the sample users and projects.

## 3. Test

- While developing: `vp test run <file>` and `vp check`.
- Before a release: `vp run build:all`, `vp check`, `vp run check:types`, `vp test run`, `vp run build:docs`.
- **[IRREVERSIBLE]** Set `VOID_TEST_DATABASE_URL` only to a disposable PostgreSQL database: the tests clear tables between cases. Without it they use their local test database.
- The kitchen-sink smoke test (`platform/scripts/kitchen-sink-smoke-test.md`) creates and removes application data: point `SMOKE_URL` only at a disposable deployed copy of `playground/kitchen-sink`.

Done when the release list passes.

## 4. Change the platform schema

1. Edit `platform/packages/api/src/schema.ts`, then `vp run --filter @voidcloud/api db:generate`.
2. Review the generated SQL and the migration journal before committing.
3. Released migrations are append-only: add a migration, never edit one. An upgrade applies new migrations while the previous Workers may still serve requests, so every schema change must stay compatible with that code.
4. Add an edge to `platform/packages/api/drizzle/compatibility.json` only after testing that the earlier runtime works against the new schema. Rollbacks rely on these edges. The runtime build checks the migration files against the recorded schema history.

Done when the build passes and each earlier runtime you listed in `compatibility.json` was tested.

## 5. Deploy a source-built runtime

Void gives a custom runtime the same integrity, migration, health and rollback checks as a packaged release. Use the core CLI workflow unless your fork supplies and maintains optional services.

1. `vp run build:core` writes `packages/platform/dist/runtime`. The build records the Git commit in the manifest, with a `-dirty` suffix for uncommitted changes. Deploy from a clean checkout, or set `VOID_PLATFORM_SOURCE_REVISION` to an immutable revision. A source archive without Git metadata builds but records no revision.
2. Preview: `void-dev platform upgrade <installation-id> --runtime packages/platform/dist/runtime --plan`. For a new install use `void-dev platform install --name <name> --application-domain <domain> --zone <domain> --runtime packages/platform/dist/runtime --plan` (`--workers-dev` instead of the domain flags for testing), and finish the installation guides first (`void-platform-install`). Done when the plan prints without error.
3. **[REMOTE]** Apply without `--plan`. Keep `--runtime` on install and resume commands, and keep the build until an interrupted install completes. Domain setup needs no `--runtime`.
4. Run one deployment per installation at a time and let it finish. **[IRREVERSIBLE]** Cancelling during migrations or Worker rollout can leave the installation waiting for recovery (`void-platform-repair-and-recovery`).

Done when the apply exits 0 and `void platform system health` exits 0. A disabled installation stays disabled.

## 6. Go further

- GitHub webhooks to an Access-protected API need a separate ingress hostname: `webhook-ingress.md`.
- Deploying source builds from CI, and compatibility checks in a fork's CI: `ci.md`.
