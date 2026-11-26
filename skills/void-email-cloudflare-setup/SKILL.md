---
name: void-email-cloudflare-setup
description: Sets up email on your own Cloudflare account - email.from, void email setup and status with --platform cloudflare, Email Routing and Sending, SPF/DKIM/DMARC, committing void.lock.json, CI with --require-email. Use when enabling email on a direct Cloudflare deploy, when a deploy ships without email, or when setup prompts block CI.
---

This applies to `void deploy --platform cloudflare`. On a Void platform use `void-email-platform-domains`; `void email usage`, `logs`, `destinations`, `allow` and `disallow` do not apply here. Lint (`config` family) checks the `email.from` format.

## Choose the sender domain

Set `email: { from: 'Acme <support@mail.acme.com>' }` in `void.config.ts` (one address, optional display name). The domain must be a zone or subdomain in your Cloudflare account. Use a mail subdomain (`mail.acme.com`) to keep existing mail on `acme.com` with its provider: Void refuses to replace another provider's MX records.

Without `email.from`, Void skips automatic setup and keeps your hand-written `cloudflare.send_email` bindings and `cloudflare.addresses`; their readiness is yours to check.

Done when `email.from` is set and its domain is in the Cloudflare account you deploy to.

## Give the CLI the permissions

Sign in with `void cloudflare login`, or set `CLOUDFLARE_API_TOKEN` with Zone Read and Email Sending Edit on top of deploy permissions, plus Email Routing Edit for apps with `email/` handlers. Global API Keys are not supported. If the browser session lacks email permissions, log out and sign in again.

Done when `void email status --platform cloudflare` runs without a permission error.

## Run setup locally

1. `void email setup --platform cloudflare`. It needs `email.from`, an interactive terminal and the permissions above; it needs no Void project. It shows the planned changes and asks before applying. [REMOTE] REMOTE STATE: it edits your Cloudflare zone (DNS, Email Routing rules, Email Sending onboarding) and, for apps with `email/` handlers, enables plus addressing for the whole zone, including the apex and other subdomains. Confirm the zone with the user and read the plan before accepting.
2. Alternative: run `void deploy --platform cloudflare` interactively, which shows the same plan and deploys after you accept ([REMOTE] REMOTE STATE: production Worker). Declining deploys the app without email. Later deploys reuse the setup.
3. `void email status --platform cloudflare`. It exits non-zero when setup is incomplete or cannot be verified.
4. Commit `void.lock.json`.

If a subdomain needs a dashboard step, follow the checklist under Email -> Settings -> Subdomains, then recheck. Existing DMARC or bounce-domain records can block sending onboarding; the checklist names the conflict.

Done when `void email status --platform cloudflare` exits 0 and `void.lock.json` with the email entries is committed.

## Match setup to the plan

- Apps without `email/` handlers: sending-only setup (routing and plus addressing untouched, so incoming mail can stay with your provider). Sending needs Email Sending, which needs Workers Paid.
- Apps with `email/` handlers: on Workers Free they keep inbound mail and send only to verified destinations (dashboard Email Routing -> Destination addresses).
- Arbitrary recipients need Workers Paid plus Email Sending onboarding. After upgrading rerun `void email setup --platform cloudflare`; once setup is saved, deploys do not retry onboarding.
- Configure SPF, DKIM and DMARC for the sender domain with Cloudflare's email authentication guidance, then check the results in a received message's original headers. A successful `sendEmail()` means provider acceptance, not authentication readiness or inbox delivery.

Done when the sending path the app needs (verified-only or any recipient) matches the account plan.

## Deploy from CI

Run `void deploy --platform cloudflare --require-email`; it [REMOTE] REMOTE STATE (production). CI cannot answer setup prompts: without `--require-email` an unconfigured app deploys without email. With it, deployment is refused when setup cannot be verified. If setup is saved but DNS has not propagated, deployment waits for a later retry. Workers Free setup for verified recipients satisfies `--require-email` for apps with inbound handlers; sending-only apps need an onboarded sending domain (Workers Paid) and a configured send binding. The CI token needs the scopes from the permissions step.

Done when the CI deploy with `--require-email` exits 0 instead of refusing.

## Change or remove email

Read [change-and-remove.md](change-and-remove.md) when you delete a handler, hand-manage `cloudflare.addresses`, or remove email setup. Read [inbound-addresses.md](inbound-addresses.md) when a mail subdomain must receive mail.
