---
name: void-platform-system-operations
description: Runs deep operator commands on a self-hosted Void platform - deployments (list, show, cancel, migrate-assets, logs), builds, `platform system` health, events, proxy-token rotation, sandbox drain. Use during an incident or when inspecting deployments and logs; hosted `platform worker` commands are not for self-hosted platforms.
---

# Platform system operations

**[REMOTE]** marks a command that changes the platform; **[IRREVERSIBLE]** marks what cannot be undone. Flags: `void platform <group> --help`.

## Before you start

- Commands use your administrator session (`void platform auth login`; scripts set `VOID_OPERATOR_TOKEN` with an explicit `VOID_API_URL` or `--connection`). The platform is chosen by `--connection <slug-or-url>`, else `VOID_API_URL`, else the active connection; check with `void platform status`.
- Read-only commands need no confirmation. Run a **[REMOTE]** command only when the operator asked for that specific action in this conversation, and show them its `--plan` output first.
- `--plan` previews, `--yes` applies without prompting (required in scripts); use one or the other. Each request allows five minutes (`--timeout <seconds>`, 1 to 3600).
- Void does not retry changes. After a timeout or lost connection, inspect the affected objects and `void platform system events` before repeating; a pending event means the outcome is not recorded yet.
- `--json` sends results to stdout and errors to stderr as JSON; errors and partial failures exit nonzero.

## 1. Inspect (read-only)

```sh
void platform system overview          # totals and recent activity
void platform system health            # exits nonzero if a check fails; result stays on stdout
void platform system events            # who changed what, with outcome
void platform system cli-versions      # CLI versions used by deployments
void platform deployment list [--project <id-or-slug>] [--status <status>]
void platform deployment show <id>
void platform build show <id>
```

Lists default to page 1, 20 items; `--limit` is 1 to 100. Done when `health` exits 0, or you have the failing check's name.

### Logs

```sh
void platform deployment logs <id> [--since <time>] [--cursor <cursor>] [--limit <n>] [--follow]
void platform build logs <id> [--since <sequence>] [--limit <n>] [--follow]
```

- Deployment logs default to the last hour, oldest first, 100 records. `--since` takes `10m`, `2h`, `1d`, an ISO date or epoch milliseconds; `--limit` 1 to 500; pass the response's `nextCursor` as `--cursor` for the next page.
- `--follow` polls every two seconds until Ctrl+C, rechecks a five-minute overlap and suppresses replays; late records may need a later historical query. It stops with an error when a window exceeds 10,000 records: use a narrower historical query. With minimal runtime logs, URLs and messages are not recorded.
- Build logs start at sequence `0`, up to 500 lines; pass `lastSeq` as `--since`. Container build logs need managed builds enabled; GitHub Actions builds return an external log URL. `--follow` waits for the final logs after the build ends and errors if completion is not confirmed within two minutes.

## 2. Cancel a deployment

**[REMOTE] [IRREVERSIBLE]** `void platform deployment cancel <id>` requests cancellation of a deployment. Cancellation cannot be taken back.

1. `void platform deployment show <id>`: cancellation applies only while the deployment is pending, uploading, migrating or prerendering (and can be requested again while canceling). One that has begun switching traffic, is compensating for a failure, or has finished cannot be canceled.
2. Confirm the deployment id and project with the operator, then run the command.

Done when `deployment show <id>` reports canceling or canceled.

## 3. Migrate legacy assets

`void platform system asset-migrations` inventories stored assets and reports `needsMigration` and `invalid` counts (page through all entries). **[REMOTE]** `deployment migrate-assets` copies a deployment's legacy assets to scoped R2 storage without changing application traffic; originals stay in place.

```sh
void platform deployment migrate-assets <id> --plan
void platform deployment migrate-assets <id> --yes [--cursor <cursor>]   # resume from the last successful batch
```

Done when `asset-migrations` shows `needsMigration` 0 for the deployment.

## 4. Rotate proxy tokens

**[REMOTE]** `rotate-proxy-tokens` gives projects new platform credentials on their live Worker and the Workers kept for rollback, without a redeploy. When a rotation finishes, the previous credentials stop working, and each rotation starts a new version of the live Worker, so WebSocket connections reconnect once. Workers kept for rollback whose author can no longer deploy keep the old credentials.

```sh
void platform system rotate-proxy-tokens --plan                      # alone: every rotation still running
void platform system rotate-proxy-tokens --project <id> --plan
void platform system rotate-proxy-tokens --project <id> --yes        # or --all
```

Each run does a bounded batch and the platform finishes the rest in the background: about 6 minutes per project, longer during a deploy. Do not rerun `--yes` for a project that is still rotating: it starts one more rotation. Done when `--plan` shows nothing pending or failed. After a platform rollback, see `void-platform-upgrade-and-rollback`.

`void platform system backfill-queue-tokens` **[REMOTE]** repairs older queue entries that lack authentication tokens; preview with `--plan`.

## 5. Drain legacy Sandboxes

**[REMOTE] [IRREVERSIBLE]** `void platform system sandbox-drain` removes legacy tenant-owned Sandbox resources, and application traffic stays paused during the cleanup. Before running it, tell the operator that apps will be down for the duration and get their go-ahead.

```sh
void platform system sandbox-drain --plan
void platform system sandbox-drain --yes
void platform system sandbox-drain --yes --cursor <nextCursor>   # continue
```

Done when a run returns no `nextCursor`, then confirm traffic is restored with `void platform system health` and an app URL.

## Hosted Void Cloud only

`void platform worker list|show|rollback|rollback-all|events` manage the Workers of the hosted Void Cloud platform and are unavailable on a self-hosted installation. To maintain a self-hosted platform's Workers use `void platform upgrade`, `rollback`, `repair`, `disable` and `enable` (`void-platform-upgrade-and-rollback`, `void-platform-repair-and-recovery`, `void-platform-disable-and-uninstall`).
