---
name: void-project-operations
description: "Operates a deployed Void project, covering `void project status|link|list|logs|requests|purge-cache|delete` and `void domain add|delete|list|status`. Use when debugging production errors, adding or removing a custom domain, purging the cache, finding which deployment is live, or deleting a project."
---

# Operate a deployed project

Two targets behave differently. A Void platform keeps a project registry, log history and request records. Direct Cloudflare has none of those: the Worker name is `cloudflare.name` in `void.config.ts`, logs are a live tail, and several commands below are hosted-only. Sign in first: `void-connect-and-login`.

## 1. Status, link, list

- `void project status [name]`: platform targets show recent deployments (`[name]` is a project slug; default is the linked project). Cloudflare targets list Worker Versions, mark the active one and show the recorded migration count; no name is accepted. Owners and administrators also see a warning when the platform cannot finish replacing the project's credentials (`void-project-team`).
- `void project link [name]` links this directory to an existing hosted project and writes `.void/project.json`; with no name it asks. Direct Cloudflare apps need no link.
- `void project list`: accessible hosted projects with slug, role, type and URL (shared projects included; the role column tells them apart). On Cloudflare it shows the Worker's versions instead.

Done when the command names the deployment or project you were looking for.

## 2. Find production errors

1. `void project logs --level error --range 12h` (add `--filter <text>`, `--deployment <id>`). One line per request, console and exception lines beneath. `--range` is `<n>m|h|d`, default `1h`, maximum `7d`. `error` includes uncaught exceptions, non-ok outcomes and any 5xx, even when the Worker neither threw nor logged. `--filter` is a case-insensitive substring match on message and exception text; it is not a level filter.
2. A caught error you only store in the database never shows up. Also call `console.error()` or `logger.error()` from `void/log`. On a platform, pass the `Error` object itself (`console.error('Save failed:', error)`); logging `error.message` leaves no stack.
3. Errors that never reach your Worker (edge routing, static requests): `void project requests --status 5xx` (`--status` takes `2xx|3xx|4xx|5xx` or an exact code). It shows status, type and duration and records no paths; use `logs` for URLs. Hosted-only.
4. Direct Cloudflare: `logs` is a live tail. `--filter` is Cloudflare's live search, `--deployment` selects a Worker Version, `--level error` selects error invocations, other levels cannot be filtered, and `--range` does not reach history. Reproduce the failure while the tail runs.

Done when you have matched the failure to a log line, or confirmed it is absent from both `logs` and `requests`.

## 3. Custom domains

`void domain add|delete|list|status <hostname> [--project <name>]`. One hostname per call; `*.example.com` is not supported, so add each subdomain. Administrators manage domains on a platform; a self-hosted platform must have been installed with `--custom-domains`.

- `add` **changes remote state.** Hosted: prints the DNS records to create for validation. Direct Cloudflare: adds a `custom_domain` route and applies only the route config at once (cron, queue and workflow triggers stay); Cloudflare manages DNS and TLS in a zone on the pinned account. Convert a legacy singular `route` to a `routes` array first so the new domain cannot shadow it. A first deploy that times out while DNS or TLS propagates: check the domain in Cloudflare and retry once `/__void/ready` answers.
- `delete` **removes the domain from the project.** Direct Cloudflare applies it immediately; deleting the last one needs `void cloudflare login` or a token with Workers Scripts: Edit. If Cloudflare rejects it, Void tries to restore the previous config and says whether it did. Confirm first: the user named this hostname and accepts that visitors using it will no longer reach the app.
- `status <hostname> [--verbose]` shows verification, TLS and the DNS records still needed; domains activate by themselves when verification and certificate issuance end. On Cloudflare it reports only whether the route is in the config, not certificate state (see the Cloudflare dashboard); `--project` applies to hosted projects only.
- `list`: hosted shows active or pending; Cloudflare lists the routes in `void.config.ts`.

Done when `void domain status <hostname>` reports active (hosted) or lists the route (Cloudflare).

## 4. Purge the cache

`void project purge-cache [--project <name>]` **empties every cached page** of the project; the edge cache clears within seconds and pages render again on demand. Hosted-only. Confirm first that the user asked. On direct Cloudflare, redeploy (each deploy starts with a fresh cache) or purge the configured ISR KV namespace yourself.

## 5. Delete a project

`void project delete [name]` **permanently destroys a hosted project and its databases, KV namespaces, R2 buckets and deployments.** Nothing restores them. The owner alone may run it.

1. Only run it when the user asked to delete this project by name. An omitted name deletes the linked project, so always pass the slug.
2. Confirm first: the slug, and that the data in its databases and buckets is exported or not needed.
3. The command asks you to type the slug. `--force` (`-f`) skips that prompt; use it only when the user said so.

Direct Cloudflare: the docs disagree. `reference/cli/project.md` says the command refuses to run; `integrations/cloudflare.md` says it "does not remove Cloudflare resources". Either way remove the Worker and its resources in Cloudflare yourself, after verifying ownership (inferred resources can be shared), and only when the user asked.

Done when `void project list` no longer shows the slug.
