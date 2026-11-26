# Recover administrator login

Use when no administrator can log in through the configured identity provider. Recovery restores an existing administrator; it creates none. It **changes who can administer the platform**, so run it only when the operator asked, and confirm the account you restore is the right person.

## Who and what you need

The installation owner, holding all of: Cloudflare management access, direct database access, and the original encrypted recovery credentials (recovery keys). Without them Void cannot do this; stop and tell the operator.

## Steps

1. Write `recovery.json`. It names the existing account: `{"administratorUserId":"existing-admin-id"}`.
   - Replacement provider: add its nonsecret `configuration` with a new connection ID, and pass the secret with `--client-secret-env <name>`.
   - Rotating an existing provider's secret: keep its connection ID and identity configuration; pass the new secret with `--client-secret-env <name>`.
   - For `--yes`: also pin `expectedIdentity` with the exact `issuer` and `subject` of the person who must log in.
2. Preview the affected administrator and connection: `void platform config auth recover <connection-id> --installation <id> --file recovery.json --plan`.
3. Show the preview to the operator. Run without `--plan` (interactive), or with `--yes`. Recovery opens a real browser login test and asks you to confirm the exact identity; a successful browser login is required even with `--yes`.
4. Done when the restored administrator signs in with `void platform auth login` and `void platform auth status` shows them.
