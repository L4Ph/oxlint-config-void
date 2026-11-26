---
name: void-platform-access-and-signup
description: Controls who can sign up to a self-hosted Void platform with `void platform signup` and `void platform invitation`. Create the first administrator, allow GitHub, email or OIDC identities, send invitations, open or restrict signup, link a second login. Use when inviting or admitting someone, opening or closing signup, or connecting to a platform behind Cloudflare Access.
---

# Who can sign up and sign in

Commands run in an operator session (`void-platform-operator-cli`): `--plan`, then `--yes` (Void also shows the change and asks you to confirm it interactively). **[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked command only when the operator asked for that change in this session. Login providers, the company gate and administrator lockout: `void-platform-login-and-admin-recovery`.

## 1. First administrator and operator session

On a new installation open `<API URL>/admin` and follow the printed administrator setup instructions; no app and no CLI sign-in is needed first. For the CLI:

```sh
void connect platform.example.com --no-login
void platform auth login
```

The first command saves the connection; the second opens the browser and saves a one-hour administrator session per platform. Done when `void platform auth status` shows the account and expiry.

Behind Cloudflare Access, `void connect <url>` handles the company sign-in first, using a locally installed `cloudflared`; install it before connecting, and do not copy browser cookies. In CI behind Access, supply a project deploy token together with origin-keyed `VOID_ACCESS_CREDENTIALS`. A Cloudflare Access service token alone does not authorize a Void deployment.

## 2. Check which platform is selected

Administrative commands use the selected platform even when run inside an app with another deployment destination. Run `void platform list` and confirm the selection (`use <connection-id>`, or `--connection <id-or-url>` per command) before any command below. Done when the platform named in `list` is the one the operator means.

## 3. Read the current access

`void platform signup show` and `void platform invitation list [--page <n>] [--limit <n>]`. Signup mode is invited/allowlisted, company-approved, or open (**People, Access** in the admin dashboard also sets it). Company-approved creates accounts for people who meet the company rules and still honors invitations and allowlist grants. Company protection at the platform edge applies before anyone sees a login page. Under invited/allowlisted signup an empty allowlist blocks every new account.

## 4. Admit a person

All **[REMOTE]**. Each grants the ability to sign up; none creates an account.

- GitHub: `void platform signup allow github <login> [--note <text>]`.
- Email or domain: `void platform signup allow email teammate@example.com` or `void platform signup allow email '*@example.com'`. Patterns apply across all sign-in providers. Quote every wildcard so the shell passes the `*`; an unquoted one expands locally. A domain entry admits everyone at that domain: confirm the domain with the operator.
- OIDC login with no verified email: `void platform signup allow identity <connection-id> '<subject>'`. Take the connection ID from `void platform config auth list` and the subject exactly as the identity provider reports it. It matches exactly and case-sensitively, with no wildcard, no email inference and no account linking; the login method's domain or group restrictions still apply, and the account joins as an ordinary user.
- Invitation: `void platform invitation send <email[,email...]>`, up to 100 addresses. It grants signup for that exact email, usable only with a login method that supplies the same verified email. When delivery is configured Void also emails instructions; if delivery is unavailable or fails the grant still works, so share the platform's `/invite` page or `void connect '<platform URL>'` yourself. The dashboard shows delivery apart from pending, accepted or revoked.

Done when `signup show` or `invitation list` lists the entry, and the person can sign in.

## 5. Remove access

- `void platform signup disallow <github|email> <pattern>` (`remove` is an alias) and `disallow identity <connection-id> <subject>` (**[REMOTE]**) affect future signup only. They do not suspend an existing account. To remove an existing user, suspend the account (`void-platform-users-and-projects`).
- `void platform invitation revoke <id>` (**[REMOTE]**) removes the exact-email grant of a pending invitation. A broader domain entry can still admit that person.
- Invitation history stays after an involved account is removed.

Done when the entry is gone from `signup show` and, for an existing user, the account is suspended.

## 6. Open or restrict signup

`void platform signup open` (**[REMOTE]**) lets anyone sign up, and **everyone who signs up can deploy apps on your application domain**. Apps on one application domain can set cookies the other apps receive; on a nested domain such as `apps.example.com` they can also set cookies for `example.com` and its subdomains; `workers.dev` testing URLs share cookies across every Worker on the account's `workers.dev` subdomain. Before opening:

1. Confirm with the operator that the application domain serves only Void apps, or that cookie sharing is acceptable. A platform serving many independent developers can also apply to the Public Suffix List.
2. Set the operating budget, retention policy and AI logging defaults (`void-platform-users-and-projects`, `void-platform-plans`): new users start on the unlimited `custom` profile.
3. Preview, then apply with the operator's go-ahead.

`void platform signup restrict` (**[REMOTE]**) requires an allowlist match again; existing accounts stay.

Done when `signup show` reports the intended mode.

## 7. Link a second login to an account

A user runs `void account link <connection-id>` (or **Account** in the dashboard), signing in again first if prompted, then authenticates with the additional provider. Confirm the identity shown matches the account owner: matching email addresses alone never link accounts, so a link made after a wrong confirmation attaches a stranger's login to the account.
