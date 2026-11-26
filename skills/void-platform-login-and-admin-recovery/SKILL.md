---
name: void-platform-login-and-admin-recovery
description: Manages login methods and the Cloudflare Access company gate of a self-hosted Void platform, and recovers administrator access, with `void platform config auth`. Use when adding, testing, enabling or disabling a login provider, choosing signup admission, enabling or removing the Access gate, or when no administrator can log in.
---

# Login methods, company gate and administrator recovery

Commands run in an operator session (`void-platform-operator-cli`; `void platform config auth` changes take `--plan` and `--yes`, unlike `void platform auth ...`). **[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change in this session. Who may sign up, invitations: `void-platform-access-and-signup`.

## 1. Initialize an existing installation (once)

An installation set up before login-method configuration existed needs **[REMOTE]** `void platform config auth initialize` once. Its current login methods and signup policy are kept. Then sign in again (`void platform auth login`). Done when `void platform config auth list` returns the methods.

## 2. Add and enable a login method

A method moves through four separate actions; none implies the next.

1. **[REMOTE]** `void platform config auth add <google|oidc|cloudflare-access> [--id <connection-id>]` or `configure <connection-id>` saves a pending configuration only.
2. `void platform config auth test <connection-id>` opens a real login in the browser and shows the authenticated account. It changes nothing; `test --json` returns the browser URL, a test ID and an expiry without waiting.
3. **[REMOTE]** `void platform config auth link <connection-id>` links the verified identity to your account. Do it for the administrator's own account, and confirm the identity shown is the administrator's.
4. **[REMOTE]** `void platform config auth enable <connection-id>` verifies the login in the browser, then applies it.

For a manually created OAuth or OIDC client, register `<platform-api-url>/auth/callback`. Done when `void platform config auth show <connection-id>` reports the method enabled and a test login succeeded.

Scripts: pass nonsecret fields with `--file <path>`, the secret by environment variable name with `--client-secret-env <name>` (omit it when editing to keep the saved secret), and `--test-id <id>` from a completed test for `enable` and `link`.

## 3. Disable a login method

**[IRREVERSIBLE]** sessions: `void platform config auth disable <connection-id>` signs out every user who logged in through it, administrators included, and revokes a login token used as `VOID_TOKEN`. Scoped deployment tokens (`void project token`) stay valid. Disabling an Access login method does not remove the company gate.

Confirm first:

1. `void platform config auth list` shows another enabled method.
2. An administrator has linked that alternative (`link`, step 2) and can sign in with it; verify with a fresh browser login, not a guess. The last method cannot be disabled.
3. The operator knows who is signed out now.

`--plan`, then `--yes`. Done when an administrator signs in through the remaining method.

## 4. Choose signup admission

`void platform config auth admission` (**[REMOTE]**) selects invited/allowlisted, company-approved or public signup. Company-approved creates ordinary accounts automatically for people who pass a configured company rule; select an enabled, company-restricted OIDC or Google Workspace method, or an enabled Cloudflare Access gate. In scripts: `admission --file <path> --yes` with `{"mode":"company","connections":["company"],"access":false}`. Public signup lets everyone deploy on the application domain: read the checks in `void-platform-access-and-signup` step 6 first.

## 5. Other situations

- Enabling or removing the Cloudflare Access gate in front of the platform: read `company-gate.md`. It ends every human session.
- No administrator can log in with the configured provider: read `admin-recovery.md`. It changes who can administer the platform.
