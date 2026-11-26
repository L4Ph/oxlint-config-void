---
name: void-platform-email-admin
description: Administers email on a self-hosted Void platform with `void platform email`. Set who the shared sender may reach, set per-project caps, register mail domains for projects, read email logs, keep Email Routing under its rule limit. Use when widening the recipient policy, registering or removing a project's mail domain, an owner has no Cloudflare account, or a send returns UNVERIFIED_DESTINATION.
---

# Email administration on a Void platform

Applies to a platform that has email enabled. Every project can send from `<slug>+tag@<mail domain>` on the shared mail domain. The platform's own mail (invitations, welcome mail, deployment alerts) uses `noreply@<mail domain>`. Commands run in an operator session (`void-platform-operator-cli`: `--plan` first, then `--yes`, then `system events`). Interrupted sends and Cloudflare timeouts: `void-platform-email-recovery`.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change in this session.

## 1. Read the current state

`void platform email policy`, `settings`, `domains [--project <id|slug>]`. Done when you can state the recipient policy (default `verified`), who registers domains (`self-serve` or `admin`), and the domains already registered.

## 2. Decide who the shared sender reaches

`verified` (default): only each project's verified recipients. `domains`: those plus any address on the listed domains. `any`: any recipient. **[REMOTE]** for the whole installation, every project at once:

`void platform email policy-set <verified|domains|any> [--domains example.com,corp.example.net]`

- Confirm with the operator which mail may now leave: widening lets every project's apps mail those recipients without per-recipient verification.
- Addresses on the platform's own mail domain stay verified-only under every policy, and so does mail sent from a project's custom domain.
- Cloudflare still refuses unverified destinations until Cloudflare Email Sending onboarding is done on Workers Paid. Until then widened sends return per-recipient `UNVERIFIED_DESTINATION`. Onboard the platform mail domain, then tell the operator the policy only takes effect for new sends; admitted attempts may finish.

Done when `policy` shows the chosen value and a test send to an unverified recipient either succeeds or reports `UNVERIFIED_DESTINATION` for the Workers Paid reason.

## 3. Set a project's caps

Defaults: 200 recipient submissions per UTC calendar month and 10 in a rolling 60 seconds. **[REMOTE]** `void platform email limit <project-id|slug> [--monthly <n>] [--burst <n>]`. Every started attempt stays charged, failed or uncertain ones included, so size caps with retries in mind. The project page in the admin UI shows and clears an override. Done when the project page shows the new values.

## 4. Register a mail domain for a project

Do this when the project owner holds no Cloudflare credential, or the operator wants to control domains.

1. **[REMOTE]** `void platform email settings-set --domains admin`. `void email domain add` now prints the command to ask the administrator for instead of starting token setup. A domain an owner registered earlier stays theirs to renew, sync and remove. Done when `settings` shows `admin`.
2. Pick the zone apex (`example.com`), not a subdomain: managed inbound mail uses the apex catch-all, which does not cover subdomains. Choose an apex that has no other mail provider; if it does, use step 5. Zones in the platform's Cloudflare account use the platform credential; no credential is stored per domain.
3. **[REMOTE]** `void platform email domain-add <apex> --project <id|slug>`. For a zone in another Cloudflare account, pipe a token scoped to that account and zone on standard input: `void platform email domain-add <apex> --project <id|slug> --token-stdin --yes < token.txt`. Remove `token.txt` afterwards.
4. `void platform email domain-status <apex>` reports inbound, outbound and management readiness separately and names any DNS or dashboard step. Do that step.
5. **[REMOTE]** `void platform email domain-sync <apex>` reconciles. Email Sending onboarding needs Workers Paid; after the upgrade, `domain-sync` retries it.
6. If a permission was refused, setup stays blocked. Give the runtime token the email permissions (Cloudflare credentials page, "enable email"), then rerun `domain-sync` to resume the same operation. Owners see administrator-registered domains in `void email domain list` and `status`, which names the `void platform email` command for steps they cannot take.
7. **[REMOTE]** `void platform email domain-rotate-secret <apex>` only when the zone ingress credential must be replaced. A blocked rotation resumes by repeating the command.

Done when `domain-status` shows inbound, outbound and management ready, or states which one is waiting and on what.

**[IRREVERSIBLE]:** `void platform email domain-remove <domain>` stops sending through the platform for that domain, and live mail through it. Confirm the project no longer sends from it. Cleanup blocked after project deletion (expired token, permission) is in `void-platform-email-recovery`.

## 5. A domain that already receives mail

If the apex's MX is with another provider (Microsoft 365, Google Workspace), register it for sending only: **[REMOTE]** `void platform email domain-add <apex> --project <id|slug> --outbound-only`. The project can send from any address on the apex; incoming mail, MX and the apex SPF stay with the current provider.

- Needs Workers Paid and Email Sending onboarding. Email Sending adds records at `cf-bounce.<domain>` and `_dmarc.<domain>`. Resolve each reported DNS conflict, then `domain-sync`.
- Only administrators register outbound-only domains. Use a zone apex separate from the platform's shared mail zone.
- To change between outbound-only and platform-managed inbound, `domain-remove` it (**[IRREVERSIBLE]** sending until re-added) and add it again.

## 6. Keep Email Routing under its limit

Shared inbound mail uses one exact routing rule per receiving project, plus per-zone plus-addressing; a project that only sends uses none. Existing rules and the apex catch-all stay. Cloudflare normally allows 200 rules per domain: remove unused rules or request a higher limit as the shared domain nears capacity. An unrelated rule for a project's base address or plus address blocks that project's inbound setup until removed. A project alias (`void email alias <name>`) adds a second rule, so resolve conflicts and check the count before an owner adds one. Done when the shared domain has headroom for the rules about to be added.

## 7. Read send logs

`void platform email logs <project-id|slug> [--page <n>] [--limit <n>] [--json]` returns receipts and recipient outcomes (operation IDs, provider references, error codes, policy versions), newest first, up to 100 per page. Message bodies, subjects, attachments and credentials are never logged. For a deleted project use its project ID within the 30-day retention.
