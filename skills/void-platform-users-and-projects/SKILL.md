---
name: void-platform-users-and-projects
description: Administers users and projects on a self-hosted Void platform with `void platform user` and `void platform project`. Suspend, restore, delete, change plan, transfer a project, normalize a project, set AI logging. Use when removing or suspending an account, transferring project ownership, a deploy reports that a project requires normalization, or prompts and responses must stay out of AI logs.
---

# Users and projects on a Void platform

Commands run in an operator session (`void-platform-operator-cli`): `--plan`, then `--yes`, then `void platform system events`. Plan definitions: `void-platform-plans`. **[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change on that user or project in this session, and name the ID you resolved it to.

## 1. Identify the account or project

`void platform user list --search <text>` (login, email or ID), then `user show <id>` for projects and usage. `void platform project list [--user <user-id>] [--search <text>]` matches slug, ID or owner login; `project show <id>` gives resources, domains, the latest 10 deployments and the latest 20 builds. Done when you hold one ID and have read its `show` output back to the operator.

## 2. Suspend or restore a user

**[REMOTE], takes the user's apps down:** `void platform user suspend <id> [--reason <text>]` blocks the user's apps, scheduled jobs and queue consumers. Suspended, each queue message is retried about once an hour and each try uses one of the queue's retries; messages are dropped when retries run out (about 3 hours with the default 3 retries, at once with `maxRetries: 0`). Suspending also replaces the platform credentials of that user's collaborator access on other projects. Suspend rather than delete when the aim is to stop traffic; use `signup disallow` only to stop future signups (`void-platform-access-and-signup`).

- Preview with `--plan` and confirm the account and projects listed.
- The last active administrator cannot be suspended or deleted, in previews, mutations and the browser admin UI. Keep another administrator with access before touching one.
- `void platform user restore <id>` (**[REMOTE]**) lifts it. Restore a mistaken suspension promptly; delivery resumes within about an hour. An administrator suspension survives a plan change; automatic usage limits do not count as suspension and never remove administrator access.

Done when `user show <id>` shows the new state and `system events` records it.

## 3. Delete a user

**[IRREVERSIBLE]** the account and every resource of every project it owns; cannot be undone. Confirm first: the operator named this account; `user show <id>` lists the projects to be deleted; any project that must survive was moved with step 5; suspension would not do instead.

`void platform user delete <id> --plan`, then `--yes`. Removing an administrator revokes administrator access first, then changes application traffic and deletes resources. If cleanup fails, access stays revoked and the error describes the partial result; a remaining administrator inspects it and retries the cleanup.

Done when `user list --search` no longer returns the account and `system events` shows the outcome.

## 4. Delete a project

**[IRREVERSIBLE]** the project and its resources; cannot be undone. Confirm the project ID, its domains and resources in `project show`, and that the owner agrees. `void platform project delete <id> --plan`, then `--yes`. If deletion stopped partway, retry it. Done when `void platform project list --search <slug>` no longer lists it.

## 5. Transfer project ownership

Only an installation administrator transfers ownership, to a user who already has an account. Remove an owner from a project only after this.

1. `void platform project owner <project-id> <new-owner-user-id> --plan`. The preview shows both owners, their plans and suspension state, blockers, and the changes to routing and usage counters.
2. Clear the blockers: wait for active rollbacks and builds; for an ordinary active deployment wait or `void platform deployment cancel <id>`; rollback deployments cannot be cancelled. A managed Sandbox controller blocks transfer until its cleanup finishes even when no container runs; the preview names the deployment that owns it.
3. **[REMOTE], revokes CI:** rerun with `--yes`. Existing project-scoped CI deploy credentials are revoked at once and the owner's usage accounting changes: earlier usage stays with the former owner, later usage counts against the new owner's plan limits. The former owner becomes a project administrator. Confirm the new owner knows their CI deploys will fail until step 4.
4. The new owner creates replacements with `void project token create --name <name> --expires-in <days>` and stores them in CI.

If the command reports an incomplete transfer, inspect the project and `void platform system events` before retrying. Done when `project show` lists the new owner, a deploy with the new token succeeds, and the plan shown is the new owner's.

## 6. Normalize a project

When a deploy reports that a project requires normalization: `void platform project normalize <id> --plan`, then `--yes` (**[REMOTE]** project records; traffic and Cloudflare resources stay). It verifies the serving deployment and recorded queue names, and refuses while deployment or recovery is active. If a queue name differs from the expected delivery routing name, reconcile the queue routing first. If the serving deployment cannot be verified, investigate the reported route. Finish interrupted deployment recovery on the previous compatible platform runtime before upgrading a project whose active deployment is missing. Done when the deploy that reported it goes through.

## 7. Plans and budgets

`void platform user plan <id> <plan-id>` (**[REMOTE]** limits and the owner's AI logging default for up to 100 projects per run; repeat the same command if it reports unfinished work). New users start on the `custom` profile, which caps no application requests, AI usage, deployments or retained deployments, and storage figures are not hard quotas. Set an operating budget and retention policy before opening signup beyond the invited team (`void-platform-access-and-signup`).

## 8. Project team and AI logging

- Remove the owner from a team only after transferring ownership. Removing a collaborator or admin, changing one to reader, or suspending or deleting their account replaces the credentials the project's Workers use for platform services (about 10 minutes; a scheduled run can be skipped for a moment).
- AI logging per project: **[REMOTE]** `void platform project ai-logging <project-id> <inherit|off|metadata|full> --plan`, then `--yes`. A new installation stores prompts and responses unless a project, plan or gateway setting disables it. Read `ai-logging.md` for modes, precedence, state checks and error codes.
