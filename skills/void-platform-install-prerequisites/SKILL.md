---
name: void-platform-install-prerequisites
description: Prerequisites for a self-hosted Void platform install - Cloudflare features (Workers for Platforms, R2, Analytics Engine), the PostgreSQL database and Hyperdrive, API tokens, R2 and signing keys, the shared mail zone. Use before the first `void platform install`, or when an install stops on a permission, database or Analytics Engine (code 10089) error.
---

# Prepare a Void platform install

Everything here happens in the Cloudflare dashboard, a database provider and a password manager. Nothing is installed yet. Install itself: `void-platform-install`.

Two marks are used in these skills: **[REMOTE]** changes Cloudflare or the platform; **[IRREVERSIBLE]** cannot be undone.

## Before you start

- Work only on what the operator asked for. Name the Cloudflare account and the installation name you will use, and get the operator's confirmation of both.
- Open one password-manager entry for this platform. Every token, key, URL and secret below goes into it the moment it is created: Cloudflare cannot show them again, and Void cannot regenerate them.
- Done when the entry exists and the operator has named the account.

## 1. Enable the Cloudflare features

In the dashboard of the chosen account, in this order:

1. **Workers & Pages**: open once so Cloudflare provisions Workers.
2. **Workers for Platforms**: enable its plan **[REMOTE]**. It is a separate paid plan; show the operator the pricing page before confirming.
3. **R2 Object Storage**: complete activation. Void creates the bucket later.
4. **Analytics Engine**: select **Enable** if prompted. No dataset is created by hand. It works on Workers Free; your database and Cloudflare usage are billed separately.

Done when all four pages show active for that account.

Install stops with "You need to enable Analytics Engine" (code 10089): open the dashboard link in the error, select **Enable**, then run the printed `void platform install --resume`. No plan upgrade and no new token is needed. If the page has no **Enable** action, deploy one disposable Hello World Worker with an Analytics Engine binding (**Settings > Bindings**), then resume. Use that separate Worker; leave the platform's Workers unchanged.

For a domain install, the domain's zone is active in this account, or Void creates the zone during install and pauses for nameservers. A zone is DNS configuration, not a purchase.

## 2. Pick the installation name and check the CLI

- Choose an unused installation name (for example `team`). Resources are `void-<name>-<role>`; Void stops on an unowned name conflict and never replaces the resource.
- The CLI needs Node.js 24.22+ or 26.12+. Done when `node --version` meets it.
- `--workers-dev` (testing) cannot be combined with `--application-domain`, `--zone` or `--dedicated-zone`.
- `void platform install --plan` previews without changing anything and without runtime secrets; run it once the steps below are done.

## 3. Create the platform database

[IRREVERSIBLE] Install claims the database. After the claim, or after Void provisions Hyperdrive, a different URL is rejected and the database cannot be swapped. Confirm the choice with the operator.

- A fresh PostgreSQL database dedicated to this platform, with no application tables, and a role that can create tables and schemas. Void creates the tables and the Hyperdrive connection, not the server.
- Connection: direct, or a session-mode pooler. Never transaction pooling. It must be reachable from your machine and from Cloudflare.
- Paste only the URL (no surrounding `psql` command) with its SSL settings, for example `sslmode=verify-full`. A Hyperdrive created by Void trusts only public certificate authorities: for a private CA, use a separately managed Hyperdrive.
- If install stopped before claiming the database (for example it was not empty), set `VOID_PLATFORM_DATABASE_URL` to another database before resuming. After the claim, keep the same database for resume and maintenance.
- Read `database.md` for PlanetScale and Neon settings and CLI recipes, connection pool sizing, and an existing Hyperdrive.

Done when the operator confirms the database is empty and dedicated, and its URL is in the password manager.

## 4. Create the API tokens

Create two tokens in Cloudflare, with the links the installer prints (it preselects permissions):

- **Management token**: your CLI creates zones, changes DNS and sets up Access with it, and later upgrades and repairs reuse it. Browser login cannot configure Access, change DNS or delete DNS, so Access and DNS work need this token.
- **Runtime token**: stored as a Worker secret so the platform deploys apps after you close the terminal. Include **Account > AI Gateway > Edit** on it.

The two are separate credentials. Paste them into the masked prompts only. Scripts supply the management token as `CLOUDFLARE_API_TOKEN`, which overrides the saved one.

Read `tokens.md` for the permission checklist, zone scope, and where the docs disagree. Done when each token's form matches the checklist and both tokens are in the password manager. Void checks access before provisioning; on a reported missing permission, edit that token for the selected account or zone and retry.

## 5. Create R2 upload keys

`void deploy` uploads static files straight to R2 through links the API signs with an R2 key pair. These keys differ from the two API tokens.

The installer opens the R2 token form with **Object Read & Write** and all buckets preselected. Create an account token (a user token if your role requires it) and save the **Access Key ID** and **Secret Access Key**. Done when both are in the password manager.

## 6. Decide who holds the signing and encryption keys

The **JWT signing key** signs login tokens; the **project encryption key** encrypts app secrets. An interactive install generates both and keeps them only in this machine's encrypted recovery files.

- To keep your own copy (CI, another machine), generate two separate keys before installing and set `VOID_PLATFORM_JWT_SECRET` and `VOID_PLATFORM_PROJECT_SECRET_KEY`. Non-interactive installs must set both.
- Generate each with `openssl rand -base64 32` (32 random bytes, base64) without printing it: pipe to the clipboard (`| pbcopy`, PowerShell `Set-Clipboard`) or use the secret manager's generator.
- [IRREVERSIBLE] The original keys cannot be regenerated: keep them for recovery and never generate replacements on resume or upgrade.
- Email also uses an independent email signing key (`VOID_PLATFORM_EMAIL_SIGNING_SECRET`, at least 32 random bytes) when you need an externally held copy.

Done when the operator has chosen "generated and kept locally" or "own copies", and for own copies both values are in the password manager.

## 7. Decide on platform email (optional)

The sender domain and its zone are fixed for the life of the installation. If email is wanted, read `email.md` before install; otherwise skip it.

## Hand off

Run `void platform install --plan` (see `void-platform-install`). Done when the plan lists the credentials you collected and reports no missing permission.
