---
name: void-direct-cloudflare-deploy
description: "Deploys to your own Cloudflare account with `void deploy --platform cloudflare`, covering the token, the first deploy, atomic mode, provisioning and readiness. Use when making a first Cloudflare deploy, linking an existing Worker, a Durable Object Worker cannot stage, a Cloudflare deploy fails on readiness, or CI deploys fail on credentials."
---

# Deploy to your own Cloudflare account

`void deploy` here **changes your production account**: it creates resources, replaces the live Worker version and its triggers, and applies database migrations (a rollback does not undo them). Run it only when the user asked for this deploy to this account. Before it, run `void cloudflare status` and confirm the deployment account with the user.

Connecting and signing in: `void-connect-and-login`. Generic deploy order, rollback, timeouts: `void-deploy`.

Read a sibling file only when its condition holds:

- `adopt-existing-worker.md`: the Worker already exists and has a root `wrangler.jsonc` or `wrangler.json`.
- `ci.md`: the deploy runs in CI, or Cloudflare Access protects the Worker you deploy.

## 1. Credentials and plan limits

- Locally, Void signs in through the browser. In CI set `CLOUDFLARE_API_TOKEN` (see `ci.md`).
- The token needs Workers Scripts: Edit, read access to bound resources, and edit access to the products Void provisions. Extra permissions by feature:
  - Hyperdrive creation: Hyperdrive edit. Or create it in Cloudflare and put its ID in `cloudflare.hyperdrive`; an existing binding works with browser login.
  - Email: Zone Read and Email Sending Edit, plus Email Routing Edit for apps with `email/` handlers.
  - Sandbox: Account / Containers: Edit and Account / Cloudchamber: Edit. Sandbox also needs Workers Paid, Docker and Containers access.
- Email to arbitrary recipients, and all sending from apps without `email/` handlers, needs Workers Paid. Apps with handlers keep inbound mail and verified recipients on Workers Free.
- PostgreSQL or MySQL: put `DATABASE_URL` in the deploy environment. Void uses it for Hyperdrive and migrations and does not write it to config. MySQL schema changes can partially apply before an error (`guide/database/mysql.md#failed-migrations`). With `--skip-migrations` and an existing Hyperdrive binding it is not needed.

Done when `void cloudflare status` shows the account you will deploy to and the credential source you intend.

## 2. First deploy

1. Run `void db generate` and commit the migrations, Better Auth tables included.
2. Set production values with `void secret put <NAME>`. Existing remote secrets are kept; `BETTER_AUTH_SECRET` is created when an auth app needs one. Local `.env` is never deployed.
3. Email apps: set `email.from` in `void.config.ts` and run `void email setup --platform cloudflare` locally. Deploy reviews the domain before building and asks before changing it.
4. Run the first deploy from one machine at a time: `void deploy --platform cloudflare`. **Changes remote state** (above). A failed build or validation can leave provisioned resources in your account; look for them before retrying.
5. Commit `void.lock.json` (and `void.config.ts`) before any other machine or CI deploys.

Deploy creates missing resources, builds, checks secrets and migrations, uploads, verifies readiness, then updates traffic and triggers. Resource IDs go to `void.lock.json`.

Rules specific to this target:

- `--project` is unavailable; the Worker and account come from `void.config.ts` and `void.lock.json`.
- `--skip-build` works only on existing static, SPA or SSG output; Worker apps need a fresh build.
- Named Cloudflare environments are unsupported. Keep one Void project config per target.
- `--provision` re-runs resource provisioning although every resource exists. It changes your account; use it only when you want provisioning redone.
- `--require-email` makes the deploy fail instead of shipping without email.
- Finish or cancel gradual rollouts in Cloudflare first.
- `void.lock.json` holds Durable Object migration history. Never delete or reorder steps already deployed.

Done when deploy prints the URL, `void project status` shows the new Worker Version active, and `void.lock.json` is committed.

## 3. Readiness and failures

- Void checks the uploaded version before it receives traffic. A Worker with no public URL (workers.dev off, no route or Custom Domain) is activated without a check.
- If readiness or a trigger update fails, Void restores the previous deployment. When the previous triggers cannot be restored (another tool deployed, or an empty draft), the new version stays live and the error names the version serving traffic.
- A new Worker may need an active first deployment before readiness can be checked. When a staged upload fails, keep `.void/cloudflare-candidate.json` and retry from the same checkout.
- Readiness denied by Cloudflare Access: `ci.md`, "Cloudflare Access readiness".

## 4. Atomic mode

For an existing Durable Object Worker that Cloudflare cannot stage:

`void deploy --platform cloudflare --atomic` **changes remote state without a readiness gate**: traffic moves to the new version before readiness is checked, and a Durable Object class migration cannot be rolled back across its migration boundary. Confirm first: the user asked for atomic, you reviewed the pending Worker and database changes, and staged deploys really cannot stage.

- `--atomic` covers one deploy. When staging consistently fails, set `deploy: { cloudflare: { mode: 'atomic' } }` in `void.config.ts`; every later plain `void deploy` is then atomic. The default is `staged`. The `config` lint family checks where the setting sits.

Done when the deploy finishes and `void project status` shows the version live.

## 5. Roll back and clean up

- `void project status` lists versions; `void project rollback [version]` restores code and recorded triggers (`void-deploy`). `void db restore` undoes D1 migrations.
- Deleting the project: the docs disagree. `reference/cli/project.md` says `void project delete` refuses to run on a direct Cloudflare target; `integrations/cloudflare.md` says it "does not remove Cloudflare resources". In both readings nothing is torn down for you. Inferred resources can be shared: verify ownership, then remove the Worker, D1, KV, R2 and other resources in Cloudflare yourself, only on the user's instruction.
