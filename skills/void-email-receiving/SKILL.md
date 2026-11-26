---
name: void-email-receiving
description: Receives email in a Void app with handlers in email/ - recipient-named files, match order, _default.ts, replies, forwards, inbound readiness, test harness. Use when adding inbound mail handlers, routing addresses to code, or when mail bounces, is not delivered to a handler, or a forward fails.
---

Lint (`convention-files` and `resources` families) checks the handler file shape and `parseEmail`/`replyEmail`/`forward` usage; this skill covers routing design and delivery. Address setup lives in `void-email-cloudflare-setup` (own account) and `void-email-platform-domains` (platform).

## Check the target

Inbound handlers work only in native Void apps; framework builds and Node.js, Bun or Deno builds do not support them. Handlers are flat files in the top-level `email/` directory; nested folders are ignored.

Done when the app is a native Void app with an `email/` directory at its root.

## Name files after recipients

A file name selects the recipient local part (before `@`, case-insensitive). The default export is `defineEmail(handler)`.

| File | Handles |
| --- | --- |
| `support.ts` | `support@` |
| `support+vip.ts` | exactly `support+vip@` |
| `support+[ticket].ts` | `support+anything@`, `info.params.ticket` |
| `[user].ts`, `[user]+[tag].ts` | any local part, `info.params.user` / `.tag` |
| `_default.ts` | everything else |

Most specific wins: `support+vip`, `support+[ticket]`, `support`, `[user]+vip`, `[user]+[tag]`, `[user]`, `_default`. Within one shape files are tried alphabetically and the first match wins, so avoid two files of the same shape that can match one address. Without `_default.ts`, unmatched mail returns to Cloudflare and the sender gets a non-delivery report.

Done when each address that must be handled maps to one file, and an address with no handler either has `_default.ts` or is meant to bounce.

## Write the handler

`defineEmail(async (message, env, ctx, info) => ...)` receives Cloudflare's `ForwardableEmailMessage`.

- `parseEmail(message)` once per message (the stream reads once); it returns `from`, `to`, `subject`, `text`, `html`, `attachments`, `headers`.
- Returning without an action accepts the message. `message.setReject(reason)` rejects with an SMTP error.
- `replyEmail(message, options)` sends a threaded reply to the sender. To reply after the handler returns, use `sendEmail` with `threading` (`void-email-sending`).
- `message.forward(to)` and `message.reply({ from, to, raw })` take bare addresses, and a forward needs a verified destination.

Done when no code path calls `parseEmail` twice for one message.

## Reply or forward on each deployment

- Own Cloudflare account: `replyEmail` defaults its sender to the address that received the mail. Forwarding needs a destination verified in Cloudflare.
- Void platform: the default sender is the project's shared address (or the address that received mail on your registered domain). `message.to` has the project prefix removed. Sender overrides must belong to the project. Replies follow the project's recipient policy: verify shared-sender recipients with `void email allow <address>`, and read `void email logs` for the provider outcome after the handler finishes.
- Custom domain relayed through the platform: forwarding needs a native Cloudflare email event, so use replies instead.

Done when each reply or forward in the code matches the deployment it runs on, and its outcome appears in `void email logs` (platform).

## Confirm inbound delivery

Void sets the inbound rule when you deploy handlers; creating a project or only sending mail needs none. On a platform, `<slug>+anything@<mail-domain>` (and `<alias>+anything@...` when an alias exists) reaches the handlers once the platform verified the rule and enabled plus addressing; deployment reports a routing conflict or capacity limit if setup cannot finish. For a registered custom domain run `void email domain status <domain>` until inbound is `ready`. On your own account follow `void-email-cloudflare-setup`.

Done when a real message to the deployed address runs the intended handler.

## Test handlers

`createInboundTestHarness({ routes: { 'support+[ticket]': support, _default } })` from `void/email/testing`; `harness.deliver({ from, to, subject, text })` returns `handler` and `params`; `harness.rejects` lists rejections. It matches in the deployed order. Pass the full platform address with project prefix (`acme+support+abc-123@acme.dev`); for a direct Cloudflare account set `slug: null` and use `support+abc-123@mail.acme.com`.

Done when a test per handler asserts `result.handler` and `result.params`.
