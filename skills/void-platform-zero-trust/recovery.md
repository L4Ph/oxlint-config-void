# Recovery and disable

Start with `void platform zero-trust status` and read the error; fix the cause before any command here. Void keeps a protected project protected, or refusing visitors, while a change is unfinished; a project being newly protected is never more open than before.

## Status stays `configuring` or `disabling`

Large changes run in steps. Scheduled maintenance continues them within a few minutes. To resume the saved operation now: **[REMOTE]** `void platform zero-trust reconcile`. If status shows an error (token permissions, the 500-application limit), fix that first, then reconcile; otherwise Void retries every hour. Done when status shows no operation running.

## One project shows an error

The rest of the change still finishes. Check it with `void platform zero-trust project-status <project-id>` (or `void project zero-trust status`), fix the cause, then reconcile that project (`reconcile.md`). A new project that could not be set up still gets created, with a warning; Void retries every hour.

## A new custom domain stays pending

Void publishes the domain only after every project is ready for it. Platform status names the projects it could not update. Check each with `project-status`, fix the cause, then run `void platform zero-trust reconcile` or rerun the domain command. `workers.dev` URLs keep working meanwhile.

## The saved Access API token expired or was revoked

**[REMOTE]** rerun configure with a replacement token, the same identity providers, the same policies and the same `--protect-new-projects` choice, and without `--existing-projects`: `printf '%s' "$ACCESS_API_TOKEN" | void platform zero-trust configure --identity-providers ... --policies ... [--protect-new-projects] --token-stdin --plan`, then `--yes`. Void continues the unfinished change, including an unfinished disable. Finish it before changing other settings.

## A selected identity provider or policy was deleted

**[IRREVERSIBLE]** protection: `void platform zero-trust disable` stops the unfinished setup, removes Void's applications and makes every project public. Confirm with the operator that public exposure is acceptable and that no protected project holds data that must stay behind sign-in. Then configure again with new selections (`SKILL.md`, step 2).

## Disable Zero Trust

Only when the operator asked for it. **[IRREVERSIBLE]** protection: `void platform zero-trust disable` removes the Access applications Void created and makes all projects public; during a disable hostnames become public at different times. Confirm first: the operator knows every project becomes public, and the projects that need sign-in have another gate.

On large installations it runs in steps. Rerun the command, or check `void platform zero-trust status`, until Zero Trust shows disabled with no operation running. Wait for that before uninstalling the platform. If project deletion stopped partway, retry `void project delete` for that project.

When an installation configured under Default-Deny uses public-only rules, keep them enabled while Default-Deny is on (`access-options.md`).
