# Change or remove email setup

Read this when a handler is deleted, `cloudflare.addresses` is hand-managed, or email must be switched off.

## Deleted handler

Void derives routing addresses from your handlers and creates their rules at deploy. After deleting a handler, review the reported stale address and set the `cloudflare.addresses` you want. Deleting a routing rule asks for confirmation in an interactive terminal; existing rules owned by another Worker or forwarding service are left in place.

## Hand-managed addresses

If you manage `cloudflare.addresses` yourself, follow the checklist Void prints; do not combine it with automatic email setup.

## Remove all email setup

DESTRUCTIVE to email: mail to the handler addresses stops being routed and sends stop working. Confirm with the user first.

1. In `void.lock.json` remove `addresses`, `send_email` and `vars.__VOID_EMAIL_FROM` from `resolved`.
2. Remove the matching overrides in `void.config.ts`.
3. Delete the routing rules in the Cloudflare dashboard.

Done when `void.lock.json` has none of the three entries, `void.config.ts` has no email overrides, and the zone's routing rules no longer list the Worker.
