# Cloudflare deploys from CI

Read when `void deploy --platform cloudflare` runs in CI, or when Cloudflare Access sits in front of the Worker. For a team platform's CI, use `void-ci-deploy-credentials`. `void init --github` writes a workflow for the saved target (`void-deploy-github-integration`).

## Secrets and variables

Store tokens as CI secrets so the provider masks them; keep credentials out of build commands. The `platform` lint family catches credentials in source and workflow code.

| Name | Set when |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Always. Permissions: `SKILL.md`, step 1. |
| `CLOUDFLARE_ACCOUNT_ID` | The token can reach several accounts. |
| `DATABASE_URL` | PostgreSQL or MySQL provisioning and migrations. |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | Fresh CI, workers.dev enabled, and the version has no preview URL. `my-team` or `my-team.workers.dev`; cached locally after a deploy. Does nothing when `workers_dev` is false. |
| `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access protects the readiness URL. |
| `CF_ACCESS_READINESS_ORIGIN` | Access protects a route or Custom Domain and `workers_dev` is false. |

Make the first deploy and commit `void.lock.json` from one machine before CI runs.

Done when a CI run ends with the deployment URL printed and no prompt waiting.

## Email in CI

Run `void email setup --platform cloudflare` locally and commit the lock file. Pass `--require-email` in CI so the deploy fails rather than shipping without email.

## Cloudflare Access readiness

- Void uses Access credentials for readiness checks without saving them. If checks are denied the deploy fails; a first-deploy bootstrap can already be active behind Access then.
- Locally you can use a short-lived user session: `export CF_ACCESS_TOKEN="$(cloudflared access token --app=https://<worker>.<account>.workers.dev)"`.
- Void sends Access credentials only to `workers.dev` URLs. With `workers_dev` false, readiness runs through your first route or Custom Domain: set `CF_ACCESS_READINESS_ORIGIN` to that hostname's exact HTTPS origin (`https://app.example.com`) in the shell or CI environment that runs `void deploy`. Void sends your Access credentials to that origin, so use only a hostname you control that serves this Worker.
