---
name: void-platform-zero-trust
description: Protects Void projects with Cloudflare Access (Zero Trust). Enable it on the platform, protect or publish one project, repair it. Use when choosing protected or public for a project, configuring or disabling platform Zero Trust, a deploy or rollback is refused over protection, webhooks or CI get a 403 sign-in page, or status is stuck.
---

# Zero Trust for Void projects

Project Zero Trust puts Cloudflare Access sign-in on every hostname of a project deployed to a Void platform: `<slug>.<domain>`, its `workers.dev` testing URL, custom domains. Protection covers the whole hostname (`/api/*`, assets, `robots.txt`, SSE, WebSockets); there are no path exceptions. It is separate from Access in front of the platform API, and projects deployed directly to Cloudflare are not affected.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator (or, for `void project ...`, the project owner) asked for that change in this session. Where a command takes `--plan`, run it first and show the result.

Who runs what: readers can inspect. The project owner and project administrators run `void project zero-trust ...`. Installation administrators (operator session, see `void-platform-operator-cli`) run `void platform zero-trust ...`.

## 1. Read the state

- Project: `void project zero-trust status [--project <slug>]`.
- Platform: `void platform zero-trust status [--check]`. `--check` also compares the saved settings with Cloudflare Access.

Done when you can say: platform status (project changes need `ready`), whether the project is protected or public, and whether protection can be changed right now.

## 2. Enable on the platform (operator, once)

Skip when platform status already shows enabled. To change providers, policies, token or the new-project default later, rerun step 2d without `--existing-projects`; existing projects keep their protection.

a. Check the requirements; all must hold, and Void rejects the configuration otherwise:

- Cloudflare Zero Trust organization in the account hosting the platform, with identity providers and reusable Access policies.
- At least one **Allow** policy that matches people by identity. Void rejects Bypass, Service Auth, and rules that allow Everyone or any service token.
- An API token of its own (not the runtime token): Access: Apps and Policies Write; Access: Organizations, Identity Providers, and Groups Read; scoped to the hosting account. Void stores it encrypted and never shows it again.
- Under 500 Access applications in the account, counting yours plus Void's (formula in `reconcile.md`). Void stops with an error above 500.
- Platform API, proxy and email gateway hostnames outside the project application domain.
- No project named `void-platform-health`: Void reserves it for its health check.
  b. Ask the operator which `--existing-projects` value they want. `--existing-projects protected|public` is required once, and rejected after Zero Trust is enabled. `protected` puts sign-in in front of every existing project; `public` leaves them open.
  c. Preview. The token goes only on standard input:
  `printf '%s' "$ACCESS_API_TOKEN" | void platform zero-trust configure --identity-providers <id,...> --policies <id,...> --existing-projects <protected|public> [--protect-new-projects] --token-stdin --plan`
  `--protect-new-projects` protects projects created from now on; without it new projects are public.
  d. **[REMOTE]** (**[IRREVERSIBLE]** the open access of every existing project when `protected`): same command with `--yes` in place of `--plan`.
  e. `void platform zero-trust status --check` shows enabled, no operation running, and no error. A large change runs in steps: status reads `configuring` until it finishes; read `recovery.md` if it stays that way.

For public-only rules under account-wide Default-Deny, install-time app access, or existing Access applications, read `access-options.md`.

## 3. Protect or publish one project

Decide with the project owner first. Protection needs a person's identity: webhooks, CI jobs, uptime checks and unauthenticated `curl` receive the sign-in page or a 403. A protected project also renders each request (Access-token requests bypass ISR and the static edge cache), which can raise latency and request usage. If a project must accept machine calls, choose one:

- make it public and authenticate callers in your own code, or
- move the machine endpoints into a separate project and make only that one public.

Then:

- **[REMOTE]** `void project zero-trust protect [--project <slug>]` or `void project zero-trust public [--project <slug>]`. `public` does not change the default for new projects. Installation administrators use `void platform zero-trust project-protect|project-public <project-id>`.
- Done when `void project zero-trust status` shows the new state with no change in progress. A change can return a short 403 while it runs; a project that was protected stays protected until it finishes.

A protected project holds up to 100 custom domains, and a new custom domain becomes reachable only after the project's protection is ready.

## 4. A deploy or rollback is refused

Deploys and rollbacks wait for a protection change to finish. Run `void project zero-trust status` for the reason. Fix the cause it names, then **[REMOTE]** `void project zero-trust reconcile` (owner or project administrator), and retry. Done when status shows the change finished and the deploy goes through. If reconcile errors, read `reconcile.md`.

## Other files

- `reconcile.md`: read when status reports drift or an error, someone edited a Void-managed Access application in Cloudflare, or you count applications against the 500 limit.
- `recovery.md`: read when status stays `configuring` or `disabling`, the saved token expired, an identity provider or policy was deleted, or the operator asks to disable Zero Trust.
- `access-options.md`: read when setting app access during `void platform install`, using Default-Deny with public apps, or connecting existing Access applications.

For which login methods and company gate protect the platform itself, use `void-platform-login-and-admin-recovery`.
