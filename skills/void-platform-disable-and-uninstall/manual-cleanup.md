# Manual cleanup after an uninstall

Read this after an uninstall finished without `--purge-resources`, or when the installation database is permanently lost. Everything here is done by hand in the Cloudflare dashboard and is **[IRREVERSIBLE]**: confirm each deletion with the operator, and skip anything already gone.

Cloudflare refuses to delete a resource while a platform Worker still uses it, which is why the order matters:

1. Delete the platform DNS record, Worker routes and custom domains.
2. If the platform sends email: open **Email Routing** for the sender domain's zone. Delete the routing rules and any catch-all rule that send mail to the platform email gateway Worker. Then remove the sender subdomain from Email Routing, or disable Email Routing if you enabled it only for the platform.
3. Open each platform Queue and remove the platform API Worker from its consumers.
4. Delete the platform Workers, except the tail Worker (its name ends in `-tail`).
5. Delete the platform Queues.
6. Delete the application Workers in the dispatch namespace, then the namespace.
7. Delete the tail Worker. Cloudflare refuses while other Workers still send logs to it.
8. Delete the platform KV namespaces and the Hyperdrive configuration.
9. Empty the R2 bucket, then delete it.
10. Delete the AI Gateway.

Done when each of these shows no platform resource in the dashboard.

## Access resources

If installation configured Cloudflare Access, the uninstall plan listed the recorded applications and service tokens with ownership and IDs. Review them in Zero Trust. Remove installer-created ones only when nothing else uses them; resources connected from an existing company setup stay under their owner's control. Uninstall does not remove the applications created for project Zero Trust: `void platform zero-trust disable` handles those (and must run before uninstall).

## workers.dev forwarders

Workers that forward workers.dev test URLs remain for manual cleanup after uninstall. Delete them with the application Workers.

## Permanently lost database

Remove the Cloudflare resources by the list above, because uninstall reads project Zero Trust state from the installation database and stops when it cannot reach it.

## Local files

Once cleanup is complete, delete from `~/.void/platforms/<account-id>/`:

- `<installation-id>.json` (the record of what was kept),
- `<installation-id>.recovery.enc`,
- `<installation-id>.secrets.enc`.

**The docs differ on the file list.** The uninstall summary names the `.json` record and the `.recovery.enc` file (kept without `--purge-data`); the lost-database paragraph also names `.secrets.enc`. Delete all three that exist. They hold installation metadata and encrypted credentials; deleting them leaves Cloudflare resources in place, so do it only after the cleanup above and after copying anything you still need (for example signing keys, which exist only in these files unless you supplied your own).
