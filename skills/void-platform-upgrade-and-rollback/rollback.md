# What a rollback breaks

Read this before you plan a rollback and again before you run it.

## Never below 0.26.0

Do not roll back to 0.26.0 or earlier after upgrading to a later release. Those releases reject the credentials that later releases give apps. Every project deployed or rotated since the upgrade then loses AI, email, ISR revalidation, remote D1, KV and R2, and prerendering until you upgrade again.

**The docs disagree here.** The upgrade page says Void checks that the earlier version can run against the current database and "refuses incompatible rollbacks"; the same page says Void "does not refuse this rollback" to 0.26.0 or earlier. Treat a passing `--plan` as no evidence that the target is safe: read the target version yourself.

If you already rolled back that far: upgrade again, then **[REMOTE]**

```sh
void platform system rotate-proxy-tokens --all --plan
void platform system rotate-proxy-tokens --all --yes
```

and repeat `--plan` until nothing is pending or failed.

## AI logging

A rollback can restore prompt and response logging. Before rolling back below 1.8.0, tell the operator which applies:

- **1.8.0**: applies project AI logging settings but ignores plan defaults. Projects without an override use the gateway's setting, which enables logging on a new installation. Plan defaults stay saved and are published again on upgrade.
- **Before 1.8.0**: no project or plan AI logging settings apply.

## Proxy-token rotations

`void platform system rotate-proxy-tokens` rotates project credentials in the background (mechanics: `void-platform-system-operations`).

1. Before a rollback, let running rotations finish: `void platform system rotate-proxy-tokens --plan` alone lists every rotation still running. Done when nothing is pending.
2. If an older proxy runs next to a newer API, prerendering and remote D1, KV and R2 fail until both run the same release.
3. After a rollback to the release just before a credential rotation, projects deployed since the upgrade lose prerendering and remote D1, KV and R2 until redeployed or until you upgrade again.
4. A rotated project deployed during any rollback stays broken after you upgrade again, and 0.26.0 and earlier also drop rotations that had not finished.
5. After upgrading again from any rollback, run the same `rotate-proxy-tokens` commands (`--plan`, then `--yes` with `--all` or `--project <id>`) and check with `--plan`.
