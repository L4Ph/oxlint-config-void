# Inbound addresses on a mail subdomain

Read this when `email.from` is on a subdomain (`mail.acme.com`) and `email/` handlers must receive mail.

With `email.from` on `mail.acme.com`, handlers receive:

| Handler | Subdomain address | Zone apex address |
| --- | --- | --- |
| `support.ts`, `support+[ticket].ts` | `support@mail.acme.com` | `support@acme.com` |
| `_default.ts` | no catch-all rule | `*@acme.com` |
| `[user].ts`, `[user]+[tag].ts` | not supported | `*@acme.com` |

Cloudflare catch-alls cover only a zone apex. On a subdomain, `_default.ts` handles only mail admitted by an explicit rule; it cannot receive arbitrary addresses. Use explicit handlers (`support.ts`) or put `email.from` on the apex.

Setup enables the zone's plus addressing, so `support+T-42@mail.acme.com` reaches `support+[ticket].ts`. The setting applies to the whole zone, including the apex and other subdomains.

`replyEmail()` defaults its sender to the address that received the message. Forwarding needs a verified Cloudflare destination.

Done when each handler address you rely on is a row above that is not "not supported" for your zone level.
