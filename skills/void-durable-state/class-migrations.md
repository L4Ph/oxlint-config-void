# Class migrations and atomic deploys

Read this before deploying a Durable Object class addition, rename or removal, or after `void.lock.json` changed.

Void records Cloudflare's class migrations in `void.lock.json`. Treat that file as Void's: review its new entries, commit them, and do not hand-edit, delete or reorder deployed entries (direct Cloudflare deployments especially).

For a class addition, rename or removal on an existing Worker:

1. Review the new migration entry in `void.lock.json`.
2. Deploy atomically: `void deploy --platform cloudflare --atomic`. If the Worker needs this on every deploy, set `deploy: { cloudflare: { mode: 'atomic' } }` in `void.config.ts` (default `staged`).
3. Atomic means Cloudflare applies the class lifecycle change in one deployment; the Worker receives traffic before Void checks readiness, and you cannot roll back across that migration boundary. Staged deploys keep pre-traffic readiness verification, so use atomic only for the class change.

Confirm before running: the migration entry is the one you expect, and a rollback past this deploy is not part of your plan. Done when the deploy finishes, readiness passes, and `void info` lists the class with its binding.
