---
name: void-deploy
description: "Deploys a Void app and handles the outcome, covering `void deploy`, migrations on deploy, `--skip-migrations`, rollback, cancel, timeouts, the schema drift check and usage-limit pages. Use when shipping to production, when a deploy fails, stalls or times out, or when rolling back."
---

# Deploy and handle the result

`void deploy`, `void project rollback` and `void project cancel` change production. Run each only when the user asked for that action on that target. Before running one, state the target (platform URL and project, or the Cloudflare account and Worker) and wait for a yes if the user has not named it.

Sign-in and target selection: `void-connect-and-login`. Deploying to your own Cloudflare account has extra steps: `void-direct-cloudflare-deploy`. First deploy to a self-hosted platform: `void-self-hosted-first-deploy`.

## 1. Pick the target once

- Cloudflare: `void connect --platform cloudflare`, then `void deploy`. With no target chosen at setup, `void deploy --platform cloudflare`.
- Void platform: `void connect <url>` is required first. A saved project URL or `VOID_API_URL` alone does not connect.
- Platform order: `--platform`, then `platform` in `.void/project.json`, then Void (projects from an older SDK). `"platform": "none"` (setup skipped) makes `void deploy` stop until you pass `--platform`.
- Project order on a platform: `--project`, then `VOID_PROJECT`, then the linked project. With none, a terminal prompts to link or create; CI (no TTY) errors, so set one.
- One deploy to a different connected platform, saved link untouched: `void connect second.example.com`, then `VOID_API_URL=https://second.example.com void deploy --platform void --project my-app`. Name the project whenever you override another platform's saved link.
- Adopting an existing Void Worker: the first deploy links it and migrates its root Cloudflare config; keep that first deploy focused on the existing app (`void-direct-cloudflare-deploy`).

Done when `.void/project.json` or your flags name the target the user asked for.

## 2. Prepare

- Keep the `void` CLI and the framework adapters on matching versions. Commit `void.config.ts` and `void.lock.json` when generated.
- Deploy applies pending SQL from `db/migrations/`. For Drizzle projects it first runs a read-only drift check; if a new migration would be generated, deploy stops. Run `void db generate`, read the SQL, commit it yourself, rerun deploy. Migrations in production cannot be reversed by a rollback (step 5).
- Production secrets come from `void secret put <NAME>`; local `.env` is never uploaded; `VITE_*` values come from the build environment.
- `--skip-migrations` deploys without application or authentication SQL: use it only when migrations run in a separate release step (`void db migrate`) or a preview shares the database. The code must work with the database's current schema, migration files and schema validation stay in place, Durable Object class migrations still run, and the next deploy without the flag applies the pending SQL. A platform that rejects the flag needs upgrading first. Deployment history then shows the migration state as unknown.

Done when `void db generate` has nothing new to write and the working tree has the migrations committed.

## 3. Deploy

`void deploy` **changes remote state.** It replaces the live version, creates missing resources, and applies pending migrations to the production database. Confirm first: the target (step 1), the reviewed migration SQL, and that the user asked for this deploy.

- Flags: `void deploy --help`. Credentials stay out of build commands; CI registers them as secrets.
- On a platform an accepted deployment keeps running if the CLI disconnects; the CLI reconnects by itself. Ctrl+C only stops watching. The CLI waits up to 30 minutes after acceptance; a timeout leaves the deployment free to continue.
- After Ctrl+C or a timeout run `void project status` before deploying again. If recovery of an interrupted deployment is running, wait for its result first.
- D1 on your own Cloudflare account: deploy saves a restore point before migrating and prints a `void db restore` command. A restore discards writes made after that point.

Done when the summary box prints the deployment URL and `void project status` lists the deployment as active.

## 4. When a deploy fails

- Every deploy writes a JSONL log under `~/.void/logs/`; failures print its path. `--debug` or `VOID_DEPLOY_DEBUG=1` mirrors it to stderr.
- Reading runtime errors afterwards: `void-project-operations`.

## 5. Roll back

`void project rollback [deployId]` **changes remote state.** It restores code (and, when both versions have complete trigger snapshots, schedules, queues, workflows, routes and custom domains). It does not reverse database changes. Confirm first: the user asked for it, the earlier code works with the current schema, and the deployment was not made by a member since removed (`void-project-team`).

- Platform: choose a retained deployment from the menu or pass its ID. Cloudflare: a complete Worker Version ID or an unambiguous prefix; `--platform cloudflare` for a one-off Cloudflare rollback.
- When the target applied fewer migrations than the current one, the CLI lists the diff and asks you to confirm. Read it before confirming.
- Database recovery is separate. D1 on Cloudflare: `void db restore` with the restore point deploy printed.

Done when `void project status` shows the intended version active and the app answers.

## 6. Cancel an active deployment

`void project cancel [deployId]` **requests cancellation** of the linked project's active deployment (or the given one, which must still be active). Platforms only; direct Cloudflare deploys are local and have nothing to cancel. The CLI asks to confirm. Confirm first that the user wants this deployment stopped. Done when `void project status` shows the deployment ended.

## 7. Limit pages

Platforms answer an over-limit app with HTTP 429 on API and Pages action requests and an error page to browsers. Override the page with standalone HTML in `public/usage-limit.html` (request limit) or `public/execution-limit.html` (CPU limit): inline CSS and data-URL images only; scripts, external assets and form submissions are disabled. A response that already started streaming cannot become an error page; handle stream failures in the UI.

## Other deploy paths

- Node, Pages `output: 'static'`, remote data, deploy-time prerendering, Sandbox and Live resources deploy only through `void deploy`, not the `void/deploy` API. The `imports` rule family flags `void/deploy` used outside Node tooling.
