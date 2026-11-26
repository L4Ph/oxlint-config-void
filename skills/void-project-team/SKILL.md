---
name: void-project-team
description: "Manages who works on a Void project hosted on a platform, covering `void project team invite|role|remove|revoke|leave|accept|decline` and the reader, collaborator and admin roles. Use when inviting someone, an invitation fails or goes missing, accepting an invitation, or removing or demoting a member."
---

# Project team

Team access is a platform feature. A project deployed directly to Cloudflare has one user and no `void project team` commands. Sign-in and platform selection: `void-connect-and-login`.

Project-scoped commands take `--project <slug>`, then `VOID_PROJECT`, then the linked project. Pass `--project` for any project other than the linked one.

## Roles

| Role                          | Can do                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Reader                        | View the project, usage, resources, deployments, builds, logs and roster. Cannot deploy.                     |
| Collaborator                  | Reader, plus deploy, rollback, cancel, migrations, secrets, database configuration and deploy prerequisites. |
| Admin (project administrator) | Collaborator, plus domains, email destinations, GitHub configuration, invitations, roles and member removal. |
| Owner                         | Admin, plus project deletion.                                                                                |

An admin has no platform-wide access. The owner's plan, limits and suspension govern the project; acting through a collaborator does not bypass an owner suspension.

## 1. Invite (owner or admin)

`void project team invite <email> --role <reader|collaborator|admin>` **sends an invitation that grants access once accepted.** Confirm first that the user named the email and the role; grant the lowest role that does the job.

- The email must already belong to a user on the same platform. An unknown email is rejected; an invitation creates no account and adds nothing to a signup allowlist.
- Invitations expire after seven days. For an expired or revoked one, invite again.
- If the platform cannot email it, the CLI prints the invitation ID and the connect and accept commands. Share them with the invitee; the invitation also shows in their `void project team pending`.
- An invitation is bound to the invited account. Forwarding its ID to someone else does nothing.

Done when `void project team invitations` lists it.

## 2. Accept (invitee)

1. `void connect <platform-url>` for the platform in the invitation.
2. `void project team pending`, then `void project team accept <invitation-id>` (or `decline`). Only the invited account can respond.
3. Accepting does not link a directory. In the invited app's checkout run `void project link`. If that checkout is already linked to another project, use a separate checkout without `.void/project.json`, connect to the invited platform there, then link.

The three commands in step 2 use the active connection from `void connect`, whatever the current directory is linked to (even a direct Cloudflare app), and show which platform they contact. `VOID_API_URL` takes precedence over the connection; an unscoped `VOID_TOKEN` selects Void Cloud, so set `VOID_API_URL` to the matching platform whenever you use `VOID_TOKEN`.

Invitation missing: check the platform and the signed-in account. To switch accounts set `VOID_API_URL` to the invitation's platform, unset `VOID_TOKEN`, run `void account logout`, then `void account login` with the invited email.

Done when `void project link` succeeds in the checkout and `void project status` lists the project.

## 3. Change a role or remove a member

`void project team list` shows user IDs and roles; `invitations` shows pending ones.

- `role <user-id> <role>` changes any non-owner member. `revoke <invitation-id>` **withdraws a pending invitation.** `remove <user-id>` and `leave` **end a member's access.** The owner cannot leave or be removed: an installation administrator transfers ownership first (`void platform project owner`).
- Removing a collaborator or admin, or demoting one to reader, makes the platform replace the credentials the project's Workers use for platform services (AI, email, remote bindings). Old ones stop working once every Worker has the new ones, usually within about 10 minutes, later while a deploy runs. If replacement cannot finish, the old ones keep working until it does, and owners and admins see a warning in `void project status` and `void project team list`.
- During the switch a Worker's platform calls can fail for a moment, a scheduled run can be skipped, queue messages arrive again a couple of minutes later, and WebSockets reconnect once.
- The removed member's code keeps running. If you do not trust it, deploy code you trust (`void-deploy`); credentials are replaced again after that deploy.
- Earlier deployments of theirs kept for rollback hold the old credentials. A rollback to one makes AI, email and ISR revalidation fail until you deploy again; pick another version (`void-deploy`).

Confirm first for `remove`, `revoke`, `leave` and demotion: the user asked, the `<user-id>` or invitation ID matches the person named, and a trusted deploy is ready if their code is live.

Done when `void project status` and `void project team list` show no credential warning and the live deployment is one you trust.
