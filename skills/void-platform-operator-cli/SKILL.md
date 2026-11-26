---
name: void-platform-operator-cli
description: Runs `void platform` operator commands safely, by hand or from CI. Select the platform, sign in, preview with --plan, apply with --yes, check system events, recover from a timeout, mint VOID_OPERATOR_TOKEN in CI. Use when scripting platform administration, an operator command timed out or lost its connection, or CI installs, upgrades or repairs a platform.
---

# Operator commands on a Void platform

`void platform ...` administers one self-hosted platform from an administrator session. Every other platform skill (`void-platform-*`) assumes the steps here.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change in this session. For any mutation, "the operator asked" includes the target: platform, object IDs and the values.

## 1. Select the platform

Selection order: `--connection <slug-or-url>`, then `VOID_API_URL`, then the active platform. A project's files never change it, and a project with a recorded platform URL keeps that platform when the global default changes. Credentials are scoped to the API origin.

- `void platform list` shows the selected platform first. `void platform use <id>` and `status <id>` take an installation slug, display name, saved ID or API URL. When a slug or name matches several platforms, pass the API URL. Non-interactive use needs an explicit selector; with one configured platform it is selected for you.
- `void platform status` for a self-hosted installation prints locally saved lifecycle progress first. That checkpoint can be stale; if live discovery fails during maintenance the command still prints it and exits nonzero, which does not confirm the platform is up.

Done when `void platform status` names the platform the operator meant and the command you are about to run carries that selection (flag, env var or active platform).

## 2. Sign in

- `void platform auth login [--provider <connection-id>]` (**[REMOTE]**, creates a session) opens the browser and saves a one-hour administrator session in the system keychain. `--provider` picks one of the enabled methods. `auth status` shows the session.
- `void platform auth logout` (**[REMOTE]**) revokes the session and deletes the local credential.
- `void platform auth token` prints the current operator token, a secret: capture it into a variable, never into a log. With `--token-stdin` it exchanges a full administrator session read from standard input for a new operator token; `auth login --token-stdin` saves that token to the keychain instead.

The API checks the administrator's current access on every request, so a removed administrator loses the token at once. Auth commands run directly: `--plan` and `--yes` do not apply to them (`void platform config auth ...` changes do take a preview).

Done when `void platform auth status` shows an active session on the selected platform.

## 3. Preview, apply, check

For every command that changes users, projects, signup, invitations, plans, Zero Trust, email or Workers:

1. Run it with `--plan`. It validates and prints the affected objects and effect, and applies nothing. Show the preview to the operator.
2. Apply: rerun without `--plan` to confirm interactively, or with `--yes`. Scripts must use `--yes`. Use one of `--plan` and `--yes`, never both.
3. Run `void platform system events`. It shows the administrator, affected objects and recorded outcome.

Done when the event for your change shows the outcome you previewed.

Output: `--json` sends results to standard output and errors to standard error as JSON; errors and partial failures exit nonzero, as does an unhealthy `system health`. Lists default to page 1 with 20 items; `--limit` takes 1 to 100.

## 4. A command timed out or lost its connection

Void does not retry changes, and some of the work may already be done. **Retrying a timed-out change can repeat partial work.** Before repeating anything:

1. Inspect the affected objects (the matching `show` or `list` command).
2. Read `void platform system events`.
3. Repeat only what did not happen. A partial result lists the work that completed and exits nonzero.

Preview and apply requests allow five minutes; reads and log polls allow 30 seconds. For an account with many resources, rerun with `--timeout <seconds>` (1 to 3600) instead of retrying blind.

Done when you can state, per object, whether the change applied.

## 5. Operator token in CI

An operator token lasts one hour. Void issues no permanent service tokens for administrator automation, so each CI job mints its own from a full administrator session (`VOID_TOKEN`, valid 30 days, injected from the secret manager). Keep operator tokens apart from deploy tokens (`void project token`); they are stored and scoped separately.

1. Disable shell tracing (`set +x`) for the whole exchange.
2. Set `VOID_API_URL` explicitly (or pass `--connection`).
3. `VOID_OPERATOR_TOKEN="$(printf '%s' "$VOID_TOKEN" | void platform auth token --token-stdin)" || exit 1`, then `export VOID_OPERATOR_TOKEN`.
4. `unset VOID_TOKEN`, run the commands, `unset VOID_OPERATOR_TOKEN`.
5. A job longer than one hour repeats the exchange while the full session is still valid; an expired operator token cannot refresh itself.
6. When the 30-day session expires or is revoked, log in again and update the protected CI secret.

**Leaks:** a token written to a log, a plaintext file or a traced shell is a live administrator credential. If one leaked, tell the operator at once: the full session must be revoked and the CI secret replaced (the docs say a session can be revoked before its 30 days end, and do not name the command).

Done when the job runs `void platform system health --json` with the minted token and the job log contains neither token.

## 6. CI install, upgrade, repair

Read `ci-install.md` before automating `void platform install`, `upgrade`, `repair`, `enable` or `rollback`, or when such a CI run stopped.
