---
name: void-platform-plans
description: Edits plans, quotas and AI logging defaults on a self-hosted Void platform with `void platform config plans`. Use when changing account limits, adding a plan, setting the signup default, archiving or removing a plan, setting an AI logging default, or when a plan update reports pending work.
---

# Plans on a Void platform

Plans are the resource limits assigned to accounts. They bill no one and buy no Cloudflare service. Changes need no app or platform redeploy. Commands need an administrator session on the right platform (`void-platform-operator-cli`); the dashboard's **Plans** page does the same with a review step per action.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change in this session. Every `plans` mutation takes `--plan` (read-only preview) and `--yes` (apply); a script without `--yes` does not apply. The commands themselves: `void platform config plans --help`.

## 1. Read the catalog and any pending work

`void platform config plans show` lists limits, the signup default, assignments and pending updates; `show <plan-id>` adds that plan's AI logging default. If it reports pending work, finish it first: **[REMOTE]** `void platform config plans sync --yes` resumes the saved updates (the dashboard button is "Continue account updates"). Edit nothing else until `show` reports no pending work.

Done when `show` lists no pending work.

## 2. Edit limits

1. Write a JSON plan file (fields in `plan-file.md`; omitted settings keep their values).
2. `void platform config plans set <plan-id> --file plan.json --plan`. Read the affected-account count and every quota warning. The preview samples accounts already above a proposed quota; lowering a quota can also restrict apps of accounts outside the sample. Usage history and billing periods are kept, so usage does not reset.
3. **[REMOTE], and can restrict existing apps** when a limit goes down: ask the operator to confirm the warnings, then rerun with `--yes`. If anyone changed the plans after your preview (dashboard: a changed catalog), create a new preview before applying.
4. Done when `void platform config plans show <plan-id>` shows the new values and no pending work. Running builds keep their recorded timeout and size; new builds use the new ones.

## 3. Add a plan, set the signup default, assign accounts

- **[REMOTE]** `void platform config plans add <plan-id> --copy <existing-id> --name "Team"` (preview with `--plan` first). The ID is stable; renaming never changes the ID or assignments.
- **[REMOTE]** `void platform config plans default <plan-id> --yes` sets the plan for new accounts only; existing accounts stay where they are. Move one with `void platform user plan <user-id> <plan-id> --yes` (`void-platform-users-and-projects`). It also changes AI logging for accounts whose plan is missing from the catalog.
- `void platform config plans reset <builtin-plan-id>` restores a built-in plan's limits and build size; custom plans have no reset values.

Done when `show` lists the plan with the expected default and assignments.

## 4. Archive or remove a plan

1. If the plan is the signup default, choose another default first (step 3). Archiving or removing the current default needs that.
2. Archive: **[REMOTE]** `void platform config plans archive <plan-id> --yes` stops new assignments and keeps current accounts. Undo with `restore`.
3. Remove: `void platform config plans remove <plan-id> --replacement <other> --plan`. The replacement is required when the plan has accounts or is the default; an unused non-default plan needs none. Read the replacement's limit, build size and short-slug changes in the preview.
4. **[IRREVERSIBLE] the plan and moves every account on it to the replacement** (usage is kept). Confirm the replacement with the operator, then rerun with `--yes`.

Done when `show` no longer lists the plan and the accounts appear under the replacement.

## 5. AI logging defaults

A new installation's gateway logs prompts and responses. When they must not be logged, set `aiLogging` to `metadata` (details, no prompts or responses) or `off` in the plan file (or per project, `void-platform-users-and-projects`); set it before opening signup. `inherit` follows the gateway; omitting the key keeps the plan's value; a project's own setting overrides its plan.

After `--yes` the CLI publishes the default and prints the expected time (normally within 2 minutes). Projects keep their old behavior until then. Done when `void platform project show <project-id>` shows the new setting. If publishing stops, `void platform config plans sync --yes` (**[REMOTE]**) or the dashboard's "Continue AI logging publish"; the platform also resumes hourly. A CLI message that the platform does not support plan defaults means run `void platform upgrade` first (**[REMOTE]**; only when the operator asked).

Moving an account to another plan, replacing a removed plan, or transferring a project applies the new owner's plan default.

## When a command fails midway

A failed or stalled update keeps the configuration saved and exits nonzero with pending work. After a lost connection, inspect `plans show` and the operator events (`system events`, see `void-platform-operator-cli`) before retrying; then step 1.
