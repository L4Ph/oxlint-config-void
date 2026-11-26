---
name: void-platform-upgrade-and-rollback
description: Upgrades or rolls back a self-hosted Void platform with `void platform upgrade` and `void platform rollback` - forward-only migrations, runtime files, credential replacement, runtime-log and AI-logging effects. Use when upgrading, when an upgrade fails with traffic paused, when changing runtime logs or storage location, or before any rollback.
---

# Upgrade and roll back a Void platform

**[REMOTE]** marks a command that changes Cloudflare or the platform; **[IRREVERSIBLE]** marks what cannot be undone. Flags: `void platform upgrade --help`.

## Before you start

- Proceed only when the operator asked for this upgrade or rollback in this conversation, on a named installation. Otherwise stop and ask.
- `void platform list` shows each installation's slug. Pass the slug or ID, or omit it only when one installation is configured. Run on the machine that installed the platform; for any other machine run `void platform discover` first (`void-platform-repair-and-recovery`).
- Keep the runtime files of the installed version (and of any version you may roll back to). Done when you know their paths.

## Upgrade

### 1. Order

Install the new CLI on the administrator's machine, upgrade the platform, then have the team update their CLI.

### 2. Prepare credentials

- Apps using `void/sandbox`: add **Account > Containers > Edit** and **Account > Cloudchamber > Edit** to the runtime token (edit it in Cloudflare, or supply `VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN`).
- To replace a credential (runtime token, GitHub OAuth credentials when GitHub login is on, R2 keys), set only those `VOID_PLATFORM_*` variables for this run. Only supplied values replace live credentials. Recovery data from an older workstation does not overwrite them, and upgrades keep the live signing keys and the complete project-encryption keyring. Keep current credentials in the secret manager: repair needs them to restore a missing Worker.
- Void checks the Cloudflare account, Workers and R2 buckets first. If it rejects the credentials, set `CLOUDFLARE_API_TOKEN` to a management token scoped to that account; it overrides the saved one.

### 3. Preview

```sh
void platform upgrade [id] --plan
```

Add `--runtime <path>` for a custom build. Void validates the runtime and checks migration compatibility; if an intermediate release is needed, it says so: upgrade to that release first. Done when the plan prints without error.

### 4. Apply

Confirm with the operator that traffic may pause and that migrations only move forward. **[REMOTE] [IRREVERSIBLE]** Applied migrations are not reversed by a rollback.

```sh
void platform upgrade [id]          # scripts and CI add --yes
```

It validates the runtime, applies pending migrations, deploys the Workers, checks health, and keeps existing Worker secrets. If deployment fails, Void tries to restore the previous Workers against the compatible schema. Retrying does not repeat completed migrations. Until health passes, visitors get a temporary-unavailability page; API requests and forms get HTTP 503 and are not replayed.

If it asks **Replace the configuration of these Workers?**, see `void-platform-repair-and-recovery`; CI stops there.

Done when the command exits 0 and `void platform system health` exits 0. Completion does not prove every project is healthy; spot-check one.

### 5. After an upgrade

- AI Gateway logging settings are published again; affected projects may show `pending` for about 2 minutes. Check with `void platform project show <project-id>`.
- Watching is optional: `<api-origin>/admin/status` (administrator sign-in) shows the saved operation, versions and traffic state.

### 6. When the upgrade fails with traffic paused

1. `void platform status <id>` prints the locally saved progress (it can be stale if another administrator acted).
2. Fix the reported problem.
3. Run the printed resume command with the same runtime files. Traffic resumes when it succeeds. Rerunning the same command is safe. A disabled installation stays disabled after an upgrade.

### 7. Change runtime logs or storage location

```sh
void platform upgrade [id] --runtime-logs minimal    # or full
void platform upgrade [id] --storage-location weur   # or automatic to clear
```

Omitting a flag keeps the current setting. Runtime logs apply to existing project deployments too; stored logs remain until Cloudflare's retention ends. Storage location affects only buckets created afterwards. If updating project logs fails, the upgrade still completes and prints a recovery command: run `void platform repair [id]` after switching to minimal, or repeat the upgrade after switching to full.

## Roll back

A rollback restores an earlier runtime. It does not reverse PostgreSQL migrations, and Void refuses a target not declared compatible with the current database. Read `rollback.md` first: it lists what a rollback breaks (credentials, AI logging, proxy-token rotations).

1. Confirm with the operator that a rollback, not a fix-forward upgrade, is wanted. Have the earlier runtime files and, for a custom installed build, its files for `--from-runtime`.
2. While runtime logs are minimal, `rollback` refuses a runtime that does not support the setting: run `void platform upgrade [id] --runtime-logs full` first.
3. Preview:

   ```sh
   void platform rollback [id] --runtime /path/to/earlier/runtime [--from-runtime /path/to/current/runtime] --plan
   ```

   Done when the plan prints without an incompatibility refusal.
4. **[REMOTE]** Apply with the same command without `--plan` (`--yes` in scripts). Traffic may pause as for an upgrade.
5. If it fails, resolve the reported problem and resume with the same runtime files; for a custom rollback, keep the source runtime files too.
6. Finish the follow-ups in `rollback.md` (proxy-token rotations). Done when `void platform system health` exits 0 and `rotate-proxy-tokens --plan` shows nothing pending or failed.
7. A later `void platform upgrade` moves forward again.
