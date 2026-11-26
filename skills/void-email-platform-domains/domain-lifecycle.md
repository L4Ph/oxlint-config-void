# Domain recovery, rotation and removal

Read this when `void email domain add` was interrupted, `status` shows a result that is not ready, the connection secret must change, or a domain is being detached.

## Interrupted or not ready

1. `void email domain status <domain>` first. It shows the recorded readiness, observation times and the latest operation, and lists dashboard or credential steps still needed. Setup returns an operation ID, so an interrupted request can be checked without restarting it.
2. `void email domain sync <domain>` ([REMOTE] REMOTE STATE) reconciles the connection and refreshes readiness. It does not rotate the secret. A blocked or uncertain operation exits non-zero and names the operation to inspect.
3. Repeat from step 1 after doing any listed dashboard step.

Done when status shows no remaining step and sync exits 0.

## Rotate the connection secret

`void email domain rotate-secret <domain>` ([REMOTE] REMOTE STATE). The secret is shared by this domain and every other domain on the same zone, so confirm with whoever owns the others.

1. Inbound must be ready: run `sync` first if setup is incomplete.
2. Run rotate-secret.
3. If the result is uncertain, inspect it with `status` before retrying.

Done when `status` shows Inbound and Management ready after the rotation.

## Remove a domain

`void email domain remove <domain>` ([REMOTE] REMOTE STATE, DESTRUCTIVE to email). It disables the domain assignment and cleans up records, so mail to that domain stops reaching the project's handlers and sends from it stop. Zone resources that another domain uses remain. Unfinished or uncertain cleanup stays recorded until it can be reconciled safely. The docs do not say a removal can be reversed; restoring means a new `domain add` with a new token. Before running it, confirm the domain name and that no handler or sender still depends on it.

Done when `void email domain list` no longer shows the domain, or shows the recorded cleanup still pending (rerun `status` and `sync`).
