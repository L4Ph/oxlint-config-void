---
name: void-platform-disable-and-uninstall
description: Takes a self-hosted Void platform offline or removes it - `void platform disable` and `enable`, `uninstall` with `--purge-data` or `--purge-resources`, manual cleanup order, token revocation, reinstall. Use when pausing, decommissioning, deleting the Cloudflare footprint of, or reinstalling a platform.
---

# Disable, enable and uninstall a Void platform

**[REMOTE]** marks a command that changes Cloudflare or the platform; **[IRREVERSIBLE]** marks what cannot be undone. Flags: `void platform uninstall --help`.

## Before you start

- Proceed only when the operator asked for exactly this action in this conversation: pause (disable), plain uninstall, `--purge-data`, or `--purge-resources`. These differ in what they delete; if the request is vague, stop and ask which one.
- Select the installation with the slug from `void platform list`. Every change command takes `--plan` (preview) or `--yes` (apply without prompting, required in scripts); use one or the other.
- Done when the operator has named the installation and the action.

## Disable and enable (pause without deleting)

Disable blocks application traffic and the platform API; domains and routes stay, no data is removed. **[REMOTE]**

1. Tell the operator: apps are down, and CLI commands that use the API (login, deploy) fail until you enable. Only `<api-url>/admin/status` and administrator sign-in stay available. Repair and upgrade keep the disabled state.
2. Queue batches are retried after five minutes instead of reaching apps, within queue retention and retry limits. For a long pause, plan a dead-letter queue or another way to recover messages first, or messages can expire.
3. ```sh
   void platform disable [id] --plan
   void platform disable [id]
   ```
   Done when an app URL no longer serves the app and `<api-url>/admin/status` still loads for an administrator.
4. To resume: **[REMOTE]**
   ```sh
   void platform enable [id] --plan
   void platform enable [id]        # add --runtime <path> for a custom build
   ```
   Enable redeploys the platform Workers from the selected runtime, verifies them, and only then restores traffic. Done when `void platform system health` exits 0 and an app URL answers.

## Uninstall

What each form deletes (confirm which one the operator wants):

| Form | Deletes | Keeps |
| --- | --- | --- |
| `uninstall` | Blocks traffic; removes Queues no remaining platform Worker uses | Workers, their Queues, KV, R2, Hyperdrive, dispatch namespace, AI Gateway, DNS, routes, custom domains, Access resources, adopted resources, external PostgreSQL, zones |
| `--purge-data` | The above plus the eligible data resources the installer owns (the docs do not list them; `--plan` does) | Workers, their Queues, R2, AI Gateway, DNS, routes, custom domains, Access resources, adopted resources, external PostgreSQL, zones |
| `--purge-resources` | Everything above plus **[IRREVERSIBLE]** platform Workers, Queues, application Workers left in the dispatch namespace, the R2 bucket and its objects, AI Gateway, the platform DNS record, Worker routes and custom domains, Access applications and service tokens the installer created | Zones, adopted resources, external PostgreSQL, other Email Routing settings, Analytics Engine datasets, Access policies and identity providers you chose, API tokens |

External PostgreSQL is never deleted. `--keep-zone` is deprecated and does nothing; zones are always kept. A platform that sends email also loses its Email Routing rules that point to the platform email gateway, and a catch-all rule is reset to drop mail.

### 1. Prepare

1. If project Zero Trust is on or has Access applications, uninstall and `--plan` stop before any change. **[REMOTE]** Run `void platform zero-trust disable` first (it removes the Access applications and makes every project public; confirm with the operator). If no platform user exists yet, uninstall turns it off itself; run it on the installing computer (update an older runtime first if asked). Done when `void platform zero-trust status` shows it disabled with no operation pending.
2. For `--purge-resources`: delete every project (`void project delete <name>`); nobody else may change the platform's Workers, routes or custom domains while it runs (a change between Void's check and its delete goes undetected); and `CLOUDFLARE_API_TOKEN` must hold the Edit permissions the plan lists. Browser login cannot delete DNS or Access resources; Access in a separate identity account needs permissions there; email needs **Zone > Email Routing Rules > Edit** on the sender zone.
3. Back up what you still need: uninstall does not touch PostgreSQL, but a reinstall needs a new empty database (the claim and tables remain).

### 2. Preview

```sh
void platform uninstall [id] [--purge-data | --purge-resources] --plan
```

Done when the plan lists each deletion in order and everything that stays, and the operator has read it. `--purge-resources` also refuses before any change while projects remain or resource reads are denied.

### 3. Apply

**[REMOTE] [IRREVERSIBLE]** Run the same command without `--plan` (`--yes` in scripts). Read checks cannot verify Edit permissions: a denied deletion can stop uninstall after traffic was already blocked and resources removed. Resources that no longer match the installation's record (a route now pointing at another Worker) are kept and listed.

- Cloudflare refuses a deletion (for example your own Worker still sends logs to the tail Worker): uninstall stops and names the resource. Fix it, rerun the same command.
- Permission denied: update the token and rerun the same command.
- A plain or `--purge-data` run that stopped partway: rerun with `--purge-resources` to also delete what it kept. After a run that finished, use the manual cleanup.

Done when the command exits 0 and lists what was kept.

### 4. Finish

1. After a finished uninstall without `--purge-resources`, do the manual cleanup in the order in `manual-cleanup.md`.
2. Revoke the Cloudflare API tokens created for the platform (uninstall never removes them).
3. Delete the local record `~/.void/platforms/<account-id>/<installation-id>.json` and its `.recovery.enc` file once cleanup is done (see `manual-cleanup.md` for a third file).
4. Reinstall needs a new empty PostgreSQL database.

Done when the tokens are revoked and the local files are gone.
