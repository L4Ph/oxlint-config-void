---
name: void-email-platform-domains
description: Manages email recipients, aliases and custom mail domains on a Void platform - void email allow, disallow, destinations, alias, and void email domain add, status, sync, rotate-secret, remove. Use when sends fail with UNVERIFIED_DESTINATION, when reserving an alias, registering a mail domain, or when domain setup was interrupted or must be removed.
---

## Scope

These commands act on a Void platform project. On your own Cloudflare account `void email usage`, `logs`, `destinations`, `allow`, `disallow` and `domain` do not apply: use `void-email-cloudflare-setup`. Project resolution is `--project`, then `VOID_PROJECT`, then the linked project; confirm which project before any command marked [REMOTE] REMOTE STATE.

## Verify recipients

The shared sender and a domain still limited to verified destinations deliver only to verified addresses.

1. `void email allow <address>` ([REMOTE] REMOTE STATE) adds the recipient and Cloudflare mails a verification link. The recipient needs no Void or Cloudflare account.
2. After the click, run `void email destinations`. The listing is what records the click; until then sends to that address return `UNVERIFIED_DESTINATION` for that recipient.
3. Link missing or expired: rerun `void email allow <address>` while the address is `pending`; the CLI re-sends or says how to get a fresh link.
4. The project owner's address is added at project creation but still needs step 2: click the mailed link, then run `void email destinations` (unless Cloudflare already verified it for an earlier project).

Done when `void email destinations` shows the address as `verified` (the other states are `pending` and `failed`).

`void email disallow <address>` removes a recipient. [REMOTE] REMOTE STATE: new sends to the address are refused immediately, with no deploy; sends already admitted may finish. Confirm the address and that no flow still needs it.

## Reserve an alias

`void email alias` shows the project's shared mail address and whether inbound mail reaches it (read-only). `void email alias <name>` reserves `<name>@<mail-domain>` and `<name>+<tag>@<mail-domain>`. IRREVERSIBLE: the alias is permanent and reserved until the project is deleted; the slug address keeps working. Before running it, confirm the exact name with the user, that it follows the project slug rules, and (for five characters or fewer) that the plan allows short names. The CLI asks to confirm; pass `--yes` only in scripts, and only after the name was confirmed.

Redeploy with the current Void version before sharing the alias so handlers get the expected `message.to`; `void email alias` reports whether inbound is ready.

Done when `void email alias` shows the new address and inbound readiness.

## Register a custom mail domain

`void email domain add <domain>` ([REMOTE] REMOTE STATE: stores an encrypted Cloudflare credential for the zone connection and configures mail on the zone).

1. Check the domain is a Cloudflare zone apex (for example `example.com`) with no mail service. Existing MX records or a catch-all pointing elsewhere block registration; a subdomain does not work for inbound because Cloudflare catch-alls cover only an apex. Each apex belongs to one project, a project may hold several. If the apex already receives mail, use another apex, the platform's shared address, or ask the administrator to register it outbound-only (sending only).
2. `add` opens a Cloudflare API-token template. Restrict the token to the selected account and the mail zone before creating it: Workers Scripts permission applies across the whole account. Confirm the restrictions at the prompt.
3. On an administrator-managed platform `add` prints the administrator's command instead; send it to them.
4. Run `void email domain status <domain>`. It reports three results: Inbound (mail reaches handlers), Outbound (ready, restricted to verified destinations, pending, or blocked), Management (the stored credential can manage the connection). Sending to arbitrary recipients needs Outbound ready; a domain limited to verified destinations still needs the recipient steps above. An administrator may also allow shared-sender mail to some recipient domains or any recipient; destinations on the platform's shared mail domain always need explicit verification.
5. Revoke unused API tokens in Cloudflare.

Done when `void email domain status <domain>` shows Inbound ready (and Outbound ready if the app sends to arbitrary recipients).

## Recover, rotate or remove

Read [domain-lifecycle.md](domain-lifecycle.md) when setup was interrupted or status is not ready (`status` then `sync`), when rotating the connection secret, or before `void email domain remove`.
