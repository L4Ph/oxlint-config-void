---
name: void-platform-repair-and-recovery
description: Repairs and recovers a self-hosted Void platform - `void platform repair`, `discover`, `install --resume`, administrator setup codes, Workers changed outside Void, another machine, backups and disaster-recovery restore. Use when a platform or install is broken, the administrator is locked out, the work moves to another machine, or data must be restored.
---

# Repair and recover a Void platform

**[REMOTE]** marks a command that changes Cloudflare or the platform; **[IRREVERSIBLE]** marks what cannot be undone. Flags: `void platform repair --help`.

## Before you start

- Proceed only when the operator asked for this repair, recovery or restore in this conversation, on a named installation. Otherwise stop and ask.
- Lifecycle commands need the local installation records in `~/.void/platforms/`. Done when `void platform list` shows the installation; if it does not, go to "Another machine" below.
- Select an installation by slug (shown beside its name in `void platform list`), installation ID or saved connection ID. With several installations, non-interactive runs need the selector, and every change needs `--yes`. `--plan` only previews.
- Void never retries changes by itself: when a request times out or loses its connection, inspect the objects and `void platform system events` before repeating it.

## Pick the situation

| Symptom                                                                            | Go to                            |
| ---------------------------------------------------------------------------------- | -------------------------------- |
| Install stopped, or a command was interrupted                                      | Resume or rerun                  |
| Resources missing, or the platform needs recreating                                | Repair                           |
| Administrator cannot sign in, setup code expired, login settings wrong, error 1050 | `administrator-login.md`         |
| Maintenance asks to replace Worker configuration                                   | Workers changed outside Void     |
| New machine, lost local records or keychain, restore from backup                   | `another-machine-and-restore.md` |

`void platform status <id>` prints the locally saved progress before checking the live API. The checkpoint can be out of date if another administrator acted, and a failed live check still exits with an error without confirming availability.

## Resume or rerun

- Unfinished install: `void platform install --resume --name <installation-id>` **[REMOTE]**, or rerun `void platform install` and choose **Continue setup**. Keep the same `--runtime` for source builds and the original secrets. Never start a second installation or regenerate keys; either breaks the saved checkpoint.
- Another interrupted maintenance command: rerun the same command. Traffic may stay paused until verification succeeds; routes, domains and data are preserved.
- The database URL can be corrected only until Void claims the database or provisions Hyperdrive. A different URL later stops before any change.

Done when the command finishes and `void platform status <id>` shows no pending operation.

## Repair

Repair recreates missing infrastructure the installer owns. It does not restore PostgreSQL rows or data held in provider resources, and a disabled platform stays disabled through repair and upgrade.

1. If an adopted or external resource is missing, restore it yourself first.
2. Preview:

   ```sh
   void platform repair [id] --plan
   ```

   Done when the plan names each missing resource and nothing unexpected.

3. **[REMOTE]** Confirm with the operator, then run `void platform repair [id]` (`--yes` in scripts). Recreating a Worker needs its original secrets (`another-machine-and-restore.md`).

Done when the command exits 0 and `void platform system health` exits 0. Repair is no substitute for a backup: data it cannot restore stays lost.

## Workers changed outside Void

Manage platform Workers only with Void commands. When a Worker's configuration was changed in Cloudflare, or Void cannot identify its active version, maintenance asks for approval to replace it.

1. Preview the affected Workers with `--plan`.
2. Run the printed command in a terminal and read **Replace the configuration of these Workers?** (default **No**). **[REMOTE] [IRREVERSIBLE]** Yes restores Void's configuration and removes manually added variables; list them for the operator first. A second confirmation may show the differences; declining it leaves any resource and database preparation already done in place.
3. A Worker on a gradual deployment: first select one version for 100% of traffic in Cloudflare.
4. CI and `--yes` runs stop at this prompt. Complete the interactive command once, then resume automation.

Done when the interactive run finishes. If traffic was paused by an earlier failed run, resume it as in `void-platform-upgrade-and-rollback` step 6.
