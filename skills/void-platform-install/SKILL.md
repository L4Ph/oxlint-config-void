---
name: void-platform-install
description: Installs a self-hosted Void platform with `void platform install` - plan, login methods, app access, runtime logs, storage location, apply, first administrator, resume - and adds the first application domain with `void platform domain set`. Use when installing, resuming an interrupted install, adding an application domain, or enabling project custom domains.
---

# Install a Void platform

**[REMOTE]** marks a command that changes Cloudflare or the platform; **[IRREVERSIBLE]** marks what cannot be undone. Run `void <command> --help` for flags.

## Before you start

- Proceed only when the operator asked for this install in this conversation, for a named Cloudflare account and installation name. Otherwise stop and ask.
- The `void-platform-install-prerequisites` steps are done: Cloudflare features enabled, database created, tokens, R2 keys and signing keys in a password manager. Done when the operator confirms each.
- Use the operator's own installation name and domain. Docs examples such as `company`, `team` and `example.com` are placeholders.

## 1. Preview

```sh
void platform install --application-domain example.app --plan   # domain install
void platform install --workers-dev --plan                      # testing, no domain
```

`--plan` changes nothing in Cloudflare and needs no runtime secrets. It saves your nonsecret choices (not secrets, not approval) locally. Choose now, as flags or at the prompts:

- `--name <slug>`: unused; Void stops on a name conflict.
- `--runtime-logs minimal` if apps can put personal data in URLs, logs or error messages. Default `full` records request URLs, console output and exception messages. The setting covers the whole platform and applies to project Workers too (change later in `void-platform-upgrade-and-rollback`).
- `--storage-location <apac|eeur|enam|weur|wnam|oc>`: default location hint for new project R2 buckets. Best effort, not a residency guarantee.
- `--dashboard-url`, `--custom-domains`, nested domains: `domains.md`.
- Email: set both `VOID_EMAIL_SENDER_DOMAIN` and `VOID_EMAIL_SHARED_ZONE_ID`, or neither (prerequisites `email.md`).
- Database: an empty dedicated PostgreSQL database; an existing Hyperdrive must have SQL caching off and an owner URL for migrations (prerequisites `database.md`).
- `--workers-dev` cannot be combined with `--application-domain`, `--zone` or `--dedicated-zone`. Install needs external PostgreSQL and at least one login method. Non-interactive runs default to GitHub when no login configuration is given.

Done when the plan prints resource names, login methods, default app access, the login callback URL, database configuration and the credential list, plus a "Next, run this command" line.

## 2. Choose login methods and app access

Select every login method you want (GitHub, Google, OIDC, Cloudflare Access): none is preselected. Cloudflare Access login and Access protection are separate choices. Read `login-and-access.md` for the callback URL, the GitHub OAuth App, Access policies, app access and `--auth-config`.

Done when each selected method has its provider credentials, and its exact printed callback URL is registered at the provider.

## 3. Give Void the management token

Paste it into the masked prompt (Void asks when it creates a zone, adds wildcard DNS or configures Access). For an existing domain, the token is scoped to that zone. To use an existing token from the shell, read it without echo or history:

```sh
read -rs CLOUDFLARE_API_TOKEN; export CLOUDFLARE_API_TOKEN
```

(`CF_API_TOKEN` also works; PowerShell: `Read-Host -AsSecureString`.) Read-only plans and workers.dev installs with the default API hostname can use browser login. Access setup and DNS need the token.

## 4. Apply

Show the operator what is created and wait for a yes: 5 Workers (plus one per workers.dev app), 3 KV namespaces, 1 R2 bucket, 3 Queues, 1 dispatch namespace, 1 Hyperdrive, 1 AI Gateway, and with a domain a wildcard DNS record (and a zone when absent). **[IRREVERSIBLE]** The database is claimed and cannot be swapped. Generated signing and encryption keys exist only in this machine's encrypted recovery files unless you supplied them.

**[REMOTE]** `void platform install`, then select the saved plan (or run the command printed at the end of `--plan`). Review the refreshed plan, answer **Apply this plan?** with Yes. Scripts add `--yes` and `--runtime <dir>` for custom builds. Without a system keychain, set `VOID_PLATFORM_RECOVERY_KEY` (base64, 32 bytes) and keep the original credentials in protected CI secrets.

The installer collects the runtime token, PostgreSQL URL, login credentials and R2 keys, masks them, and saves progress encrypted. Keep a password-manager copy of everything it collected.

Done when the installer prints the API URL and the admin dashboard link.

## 5. Sign in as the first administrator

Open the printed dashboard link. GitHub-only: sign in as the administrator chosen during install. Configurable login: open the printed `/setup` URL, enter the one-time setup code, authenticate, and confirm the displayed identity. That method becomes enabled; other selected methods are saved as pending, to test and enable in Settings.

Done when the administrator is signed in. Failed sign-in, or an expired code: `void-platform-repair-and-recovery`.

## 6. Clean up the shell

If you exported the token, run `unset CLOUDFLARE_API_TOKEN` (PowerShell: `Remove-Item Env:CLOUDFLARE_API_TOKEN`). The saved token stays for maintenance. Done when the variable is no longer in the environment.

## 7. Resume when setup stops

When Void created a zone it stops in `waiting-for-dns` and prints nameservers. Set them at the registrar, wait for the zone to become active, then **[REMOTE]**:

```sh
void platform install --resume --name <installation-id>
```

- Resume uses the saved checkpoint and original secrets. Never start a second installation or generate replacement keys. For a source build pass the same `--runtime` directory.
- Stopped before a checkpoint existed: rerun `void platform install` and pick the saved plan, or rerun the original command. **Continue setup** in the installer also works.
- Hyperdrive selection missing from the checkpoint: add `--hyperdrive <existing-id>`.
- Cloudflare rejects the runtime token, or a permission (for example email) is missing: update the token's permissions and resume, or set `VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN` to a replacement; Void saves it and updates Workers the interrupted run deployed.
- Default-Deny error 1050 on the health check: `void-platform-repair-and-recovery`.

Done when the installer reaches the API URL printout.

## 8. Add the application domain (workers.dev platforms)

Add only the first domain; replacing a configured application domain is unsupported. Grant the runtime token **Cache Purge: Purge** on the new zone and set a management token first.

```sh
void platform domain set example.app --plan
void platform domain set example.app      # [REMOTE]; scripts add --yes
```

If nameservers, certificates or project Zero Trust protection are pending, follow the printed guidance and rerun the same command. Existing workers.dev URLs, the API URL, projects and deployments stay. Apps with their own OAuth providers must register their new callback URLs. Domain conflicts, nested domains, cookie sharing and project custom domains: `domains.md`.

Done when `domain set` reports HTTPS verified for the new application URLs.
