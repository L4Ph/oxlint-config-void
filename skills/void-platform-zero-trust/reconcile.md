# Reconcile and Void-managed applications

Void creates and owns self-hosted Access applications in the Zero Trust organization: a shared project application (`*.<domain>` plus this installation's `workers.dev` URLs), a public exception per public project, a custom-domain application per project with managed custom domains, and a health-check exception (`void-platform-health.<domain>/health`). In public-only mode a "public app management check" (Deny Everyone, reserved unused path) replaces the shared wildcard. `void platform zero-trust status` shows exact names and IDs of the shared and health-check applications; `void platform zero-trust project-status <project-id>` shows a project's.

## Count the applications

Void needs `1 + health-check applications + public projects + projects with managed custom domains`. Count a health exception once, also when the installer shares it. Example: 40 projects, one health exception, 10 public, 5 with managed custom domains = 1 + 1 + 10 + 5 = 17. Add that to the applications you manage outside Void; the account limit is 500 and Void stops with an error above it.

## Do not edit Void-managed applications

Manage them through `void platform zero-trust configure` and the project commands. Editing or deleting one in the Cloudflare dashboard can block access until you reconcile, and dashboard edits can be overwritten the next time Void updates the application.

- Deleting the shared application blocks protected projects until reconciled.
- Deleting the health-check exception can block upgrades and repair until it is restored. Do not delete it, and do not delete the shared application.
- A renamed application: restore its recorded name before reconciling. Void does not remove duplicate copies; remove them yourself.

You may edit the rules of a selected reusable policy in Cloudflare. The change reaches every project using it. Keep it an identity-based Allow policy without Everyone or service tokens, then run `void platform zero-trust status --check`:

- `drifted: true`: run `void platform zero-trust reconcile`.
- `present: false`: check the token, application, identity providers and policies, then reconcile.

`--check` covers the shared and health-check applications. For a public exception or custom-domain application, use the project's reconcile command.

## Repair commands

| Command                                                   | Scope                         | Who                                   |
| --------------------------------------------------------- | ----------------------------- | ------------------------------------- |
| `void platform zero-trust reconcile`                      | platform and all projects     | installation administrators           |
| `void platform zero-trust project-reconcile <project-id>` | one project                   | installation administrators           |
| `void project zero-trust reconcile [--project <slug>]`    | linked project or `--project` | project owner, project administrators |

All three **CHANGE** remote state and are not destructive. Project reconciliation needs platform status `ready`; when it is not, reconcile the platform first. Void also retries failed projects every hour.

Done when `status --check` shows no drift, `present: true`, and no operation or error; for a project, `void project zero-trust status` shows the intended state.
