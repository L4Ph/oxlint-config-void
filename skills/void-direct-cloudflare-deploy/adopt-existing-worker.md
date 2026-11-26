# Adopt an existing Worker

Read when a Worker is already deployed and the app has a root `wrangler.jsonc` or `wrangler.json`. Void takes it over; the first deploy changes how the project is configured, not what it runs.

## Prepare

1. Convert `wrangler.toml` to JSON or JSONC before linking.
2. Keep the root wrangler file in place. `void deploy` and `void init` migrate legacy config on their own; `void migrate` does it explicitly and saves backups in `.void/config-migration/`.
3. Resolve conflicting Cloudflare configs first, and keep the `void` package and CLI on one version.
4. Cloudflare must hold no newer inactive upload for the Worker. If it does, activate or remove it in Cloudflare before retrying.
5. Readiness checks need an existing version metadata binding or access to Version URLs. Void stops before activation when neither exists.

## Link and deploy

`void deploy` **changes your production Worker.** Run it only when the user asked to adopt this Worker; confirm the Worker name and account first.

- With no destination selected, Void offers to link the existing Worker. Accept to sign in and deploy.
- Void migrates the configuration to `void.config.ts` and `void.lock.json`, keeping bindings, variables, secrets, routes and schedules. Commit both files.
- Keep this first deploy to the existing app. Add resources, auth, migrations and other runtime features in later deploys.

Done when the deploy succeeds, `void.config.ts` and `void.lock.json` are committed, and the Worker serves the same routes as before.

## When linking stops

- Missing binding: give the existing Worker's binding name and resource ID in `cloudflare` and in `inference.bindings`, and keep `.void/cloudflare-link.json` for the retry.
- Prerendered pages may need a new ISR cache. Void asks and saves the answer as `routing.isr`; `false` renders those pages on every request. A CI run cannot answer: set `routing.isr` in `void.config.ts` before deploying. Existing caches keep their IDs.
- A Durable Object Worker that cannot stage: atomic mode, in `SKILL.md`.

## Later changes

Before changing dashboard-managed triggers or visibility, copy the current `routes`, `workers_dev` and `preview_urls` into your config. Named environments need a separate Void project config each.
