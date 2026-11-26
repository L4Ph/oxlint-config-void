---
name: void-email-sending
description: Sends transactional email from a Void app with sendEmail - sender choice, from and recipient rules, threading, idempotent retries, limits, dev inbox. Use when adding outbound email, when a send returns INVALID_FROM, UNVERIFIED_DESTINATION, MIME_ERROR or OUTCOME_UNKNOWN, or when retries risk duplicate mail.
---

`sendEmail` comes from `void/email`. Lint (`resources` family) checks call shapes, option limits, result checks and idempotency keys in queues and cron; this skill covers the delivery model. Setup of a sender belongs to `void-email-cloudflare-setup` (own account) and `void-email-platform-domains` (platform recipients and domains).

## Pick the sender

| Deployment                      | Sender                                       | Who may receive                                                                     |
| ------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| Email-enabled Void platform     | shared sender `<slug>+noreply@<mail-domain>` | verified recipients only                                                            |
| Platform, own domain registered | any address on that domain                   | all, once outbound is ready                                                         |
| Own Cloudflare account          | `email.from` in `void.config.ts`             | registered recipients; any recipient with Workers Paid and Email Sending onboarding |

The shared sender suits team alerts, project notifications and replies to inbound mail. For mail to arbitrary users register your own domain, use your own Cloudflare account on Workers Paid, or call another provider from the handler.

Done when the sender row is known and its setup skill has been followed.

## Check recipients before the first send

- Platform: your account email is a recipient from project creation but still needs verification. Open the link Cloudflare mailed, then run `void email destinations`; it records the click. Add others with `void email allow <address>` (flow in `void-email-platform-domains`). Until verified, that recipient fails with `UNVERIFIED_DESTINATION`.
- Own Cloudflare account: Cloudflare's `send_email` binding delivers only to registered addresses. On Workers Free, apps with `email/` handlers send to destinations listed in the Cloudflare dashboard under Email Routing -> Destination addresses.

The docs conflict here: `guide/email/sending.md` tells you to register binding recipients with `void email allow`, while `guide/email/domains.md` says `void email usage`, `logs`, `destinations`, `allow` and `disallow` apply to Void platforms only. Use the CLI on a platform and the dashboard on your own account.

Done when `void email destinations` (platform) or the dashboard lists every recipient of the first send as verified.

## Set the from address

- Platform: `from` must be `<slug>@<mail-domain>`, `<slug>+<tag>@<mail-domain>`, an alias address (`<alias>@...`, once the owner reserved one) or an address on a domain registered with `void email domain add`; anything else returns `INVALID_FROM`. Omit `from` to get `<slug>+noreply@<mail-domain>`. A project slug longer than 56 characters (older projects) must pass `from` explicitly.
- Own Cloudflare account: `from` defaults to `email.from` and must be on a domain the account can send from; anything else returns `INVALID_FROM`.

Done when a send in the target environment does not return `INVALID_FROM`.

## Read the result

`sendEmail` returns a result and does not throw. Check both failure shapes: `result.error` is a request-level failure; `result.deliveries` lists per-recipient failures (an unverified recipient fails there). `ok: true` means the provider accepted the send, not that the mailbox received it.

Done when the code inspects `result.ok`, then `error`, then each failed delivery.

## Reply later

For a reply from a queue job or other later task, save the incoming message's `Message-ID` and `References` headers in the inbound handler. Later pass ``threading: { inReplyTo: messageId, references: `${references} ${messageId}` }``. `references` lists earlier IDs in order and ends with the parent; if omitted it defaults to `inReplyTo`. Use `threading`, not custom `In-Reply-To`/`References` headers; invalid IDs are dropped without failing the send. For an immediate reply inside the handler use `replyEmail()` (see `void-email-receiving`).

Done when the reply shows in the same conversation in a mail client.

## Retry safely

A timeout can return `OUTCOME_UNKNOWN`: the provider may have accepted the message. Never resend blindly.

1. Run `void email logs --limit 50` (platform): it shows operation, recipient, direction, state and error code for 30 days, without subjects or bodies.
2. If the send is not recorded, retry with the same `idempotencyKey` (1-128 printable non-space ASCII characters). For 30 days the same key and payload returns the recorded outcome with no new submission; the same key with a different payload returns `IDEMPOTENCY_CONFLICT`. A new key is a new send and can duplicate.

Native Cloudflare binding sends have no platform idempotency keys, and `void email logs` is a platform command; on your own account check delivery in Cloudflare before resending.

Done when no code path retries a send under a new key after `OUTCOME_UNKNOWN`.

## Stay within limits

- At most 50 recipients across `to`, `cc`, `bcc`; ASCII local parts, punycode domains.
- Encoded message at most 5 MiB, custom headers at most 16 KiB; larger returns `MIME_ERROR`.
- Platform default allowance: 200 recipient attempts per UTC month, 10 per rolling minute. Started attempts count even when delivery fails or the outcome is unknown. Run `void email usage` before a bulk send.

Done when `void email usage` shows enough allowance for the planned send.

## Test and develop locally

In dev, sends go to an in-memory inbox; the dev server prints `/__void/inbox?token=...`. The URL carries an access token (also in `.void/dev-trigger-token`): treat it as a credential, and do not paste it into logs, issues or screenshots, especially when exposing the dev server. The inbox works in native Void apps, TanStack Start and React Router; in SvelteKit, Nuxt, Analog and Astro sends return `BINDING_MISSING`. In tests use `createEmailTestHarness` from `void/email/testing` and call `dispose()`.

Done when a test asserts the message through the harness and the harness is disposed.
