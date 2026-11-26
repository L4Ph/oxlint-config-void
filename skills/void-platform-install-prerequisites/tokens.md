# Cloudflare API token permissions

Read this when you create or edit the management or runtime token, or when Void reports a missing permission.

## Scope

- Existing zone: in Cloudflare's form change **All Domains** to **Specified Domains** and select the zone.
- New zone (Void creates it): keep **All Domains** on both tokens. The zone does not exist yet, and the runtime token needs cache-purge access to it.
- Skip zone permissions until you add a domain (workers.dev testing).

## Permissions

Cloudflare labels write access **Edit** or **Write** depending on the screen.

| Scope | Permission | Management | Runtime |
| --- | --- | --- | --- |
| Account | Account Settings | Read | Read |
| Account | Workers Scripts | Edit | Edit |
| Account | Workers Tail | Read | Read |
| Account | D1 | Edit | Edit |
| Account | Workers KV Storage | Edit | Edit |
| Account | Workers R2 Storage | Edit | Edit |
| Account | Queues | Edit | Edit |
| Account | Hyperdrive | Write | Write |
| Account | Account Analytics | Read | Read |
| Account | AI Gateway | Edit | Edit (table: only when installing with browser login) |
| Account | Containers | - | Edit |
| Account | Cloudchamber | - | Edit |
| Zone | Zone | Read | - |
| Zone | DNS | Edit | - |
| Zone | Workers Routes | Edit | - |
| Zone | Cache Purge | - | Purge |

Extra permissions, by feature:

- Access in the installation account (management token only; the runtime token needs none): **Access: Apps and Policies > Edit**, **Access: Organizations, Identity Providers, and Groups > Read**; protection adds **Access: Service Tokens > Edit**. When existing applications are selected, the link asks for Read instead of Edit.
- Void creates the zone: management token needs **Zone Edit** with authority to create zones. Zone already exists: Zone Read and DNS Edit on it.
- Nested application domain (`apps.example.com`): management token **SSL and Certificates: Read**.
- Project custom domains: runtime token **SSL and Certificates: Edit** on the application zone; a token created before custom domains were on needs it added.
- Email: see `email.md`.

Done when each token's form matches this table plus the extras that apply, and the operator has seen the final form.

## Where the docs disagree

- **AI Gateway on the runtime token.** The permission table says Edit only "when installing with browser login". The prose says "Include Account > AI Gateway > Edit on the runtime token so Void can verify and create that resource", and that browser login does not grant AI Gateway access. Include it on the runtime token.
- **Containers and Cloudchamber.** The table lists both as Edit for the runtime token among the core permissions. The upgrade page says to add them when apps use `void/sandbox`. The self-hosted overview lists Sandboxes as part of the core installation. Include both when any app will use Sandboxes; the docs do not say a platform without them fails.

## Replacing or checking a token later

Edit the token's permissions in Cloudflare, or supply a replacement with `VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN` on resume or upgrade. When maintaining from another machine, set that variable to the current runtime token so the CLI can check its permissions.
