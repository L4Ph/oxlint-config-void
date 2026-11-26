# Another machine, backups and restore

Read this when local installation records or the keychain are gone, the work moves to another machine, or data must be restored.

## Manage from another machine

`discover` restores the administrator's local installation records after verifying that the resources belong to your platform. It works for interrupted and disabled installations. It downloads no credentials, key material or data. If ownership cannot be verified, it stops without changing resources.

```sh
void platform discover --account <account-id> --installation <id-or-name>   # reads and verifies; writes local records only
void platform repair [id] --plan                                            # when infrastructure is missing
```

1. Set `VOID_PLATFORM_DATABASE_URL` (migrations and administrator coordination).
2. Supply what recreating a Worker needs, from your secret manager. Cloudflare cannot return these values. An upgrade that preserves every deployed Worker needs none of them.

   | Recreating | Needs |
   | --- | --- |
   | Email gateway | `VOID_PLATFORM_EMAIL_SIGNING_SECRET` only (no Cloudflare runtime token, no JWT key) |
   | Proxy | Runtime token (`VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN`), JWT signing key (`VOID_PLATFORM_JWT_SECRET`), and the email key when email is on |
   | API | Original runtime token, R2 keys, JWT secret and project-encryption values through `VOID_PLATFORM_*`; the email key when email is on; a GitHub-only install also its original GitHub OAuth values |

3. Project-encryption key not rotated: `VOID_PLATFORM_PROJECT_SECRET_KEY`. After a rotation: `VOID_PLATFORM_PROJECT_SECRET_KEYS_JSON` with every retained key and `VOID_PLATFORM_PROJECT_SECRET_ACTIVE_KEY_VERSION` with the active key's name. Keep older keys that existing project secrets still need. These values recreate a missing API Worker; they do not replace live keys in an ordinary upgrade.

Done when `void platform list` shows the installation and `void platform status <id>` reaches the live API.

## Back up as one recovery point

Keep, and label as one recovery point, for each installation:

- a PostgreSQL backup;
- the installation identity in a secret manager: JWT signing secret, email signing secret when email is enabled, the complete project-encryption keyring;
- provider-supported backups or exports for every data-bearing provider resource;
- the immutable runtime artifacts and manifest of the installed version or custom source revision.

Backup and retention vary by provider and resource: choose and test a recovery process for each. Signing and encryption keys that Void generated exist only in the local recovery files, so copy them out now.

## Restore

[IRREVERSIBLE] Restoring over live data replaces it, and discovery does not recover data. Confirm the target database and the recovery point with the operator before step 2.

1. Keep platform and application traffic disabled before changing any resource (`void-platform-disable-and-uninstall`).
2. Restore the matching PostgreSQL and provider data with their own recovery tools.
3. Supply the original identity and keyring, and use the preserved runtime artifact.
4. `void platform discover ...`, then `void platform repair [id] --plan`; review every ownership decision and proposed resource change.
5. **[REMOTE]** Apply the repair.
6. Enable traffic only after the restored data and platform health are verified (`void platform system health` exits 0).

Discovery and repair give no recovery bypass when required secrets or data are unavailable.

## Where local state lives

Installation records are in `~/.void/platforms/`. Credentials are in encrypted recovery files, with the encryption key in the operating system keychain. Without a keychain Void stops before writing secrets: headless environments supply `VOID_PLATFORM_RECOVERY_KEY`, a canonical base64 32-byte key from a secret manager. A temporary CI runner may use a new recovery key for each run only when every original credential stays in protected CI secrets: `VOID_PLATFORM_JWT_SECRET`, `VOID_PLATFORM_EMAIL_SIGNING_SECRET` (email-enabled), and either `VOID_PLATFORM_PROJECT_SECRET_KEY` or the complete rotated keyring with its active version.
