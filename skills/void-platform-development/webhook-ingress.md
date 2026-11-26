# GitHub webhook ingress for an Access-protected API

Read this only when your fork has added managed GitHub builds and Cloudflare Access protects its API hostname.

The core installer does not deploy the dashboard, GitHub App, build Containers or webhook ingress, and `--runtime` with a source build provisions none of their infrastructure, bindings, credentials or capabilities. The repository's hosted deployment scripts target Void Cloud only; they are not a setup procedure for a self-hosted platform. Without Access protection, GitHub can call the API's `/webhooks/github` directly and none of this applies.

With Access in front, GitHub cannot reach `/webhooks/github`, because GitHub does not present your Access credentials. Do not add an Everyone or bypass policy to the API's Access application. Deploy the ingress at a separate public hostname instead: it accepts signed deliveries at `POST /github` and forwards them to the API through a service binding.

**[REMOTE]** Each step changes your Cloudflare account; do them only when the operator asked for this ingress.

1. In your fork, provision the GitHub App, build executors, API bindings, credentials and managed-build capability, and deploy its source API runtime with the internal operation. A core install or upgrade alone adds no managed builds.
2. Edit `platform/packages/api/wrangler.github-webhook-ingress.jsonc`: give the ingress a name unique to the installation, and set its `API` service binding to the exact installed API Worker name. Keep its public hostname apart from every human or API hostname that Access covers.
3. Deploy: `vp run --filter @voidcloud/api deploy:github-webhook-ingress --env production` (`--env staging` for the staging entries).
4. In the Cloudflare dashboard add encrypted Worker secrets: the GitHub App's existing `GITHUB_WEBHOOK_SECRET` on both the API and the ingress Workers, and a separate high-entropy `GITHUB_WEBHOOK_INGRESS_SECRET` (for example `openssl rand -base64 32`) on both. Do not reuse a platform management, JWT, Access or GitHub webhook credential for the ingress secret.
5. In the GitHub App settings keep **Content type** `application/json`, keep the same webhook secret, and set **Webhook URL** to the ingress URL ending in `/github`. Use GitHub's test delivery.

Done when the test delivery returns 2xx. The ingress accepts payloads up to 25 MiB (GitHub's payload cap).
