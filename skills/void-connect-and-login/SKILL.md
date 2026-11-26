---
name: void-connect-and-login
description: "Connects the Void CLI to a deploy target and signs in, covering `void connect`, `void auth`, `void account`, `void cloudflare`, VOID_TOKEN and VOID_API_URL. Use when choosing between your own Cloudflare account and a Void platform, when a connect or login command fails, or when CI needs credentials."
---

# Connect the CLI and sign in

Every deploy-side command reads the target that `void connect` saved. Do this skill first; then deploy (`void-deploy`).

## 1. Choose the target

| Target            | What it is                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Direct Cloudflare | Your own account. No project registry, no team features. Worker name comes from `cloudflare.name` in `void.config.ts`. |
| Void platform     | A team platform at a URL your administrator gives you. Has projects, roles, retained logs.                             |

`void connect` with no arguments asks. `void connect <url>` selects a platform. `--platform cloudflare|void` selects the kind (`void` offers saved platforms plus "enter another URL").

- A hostname connects over HTTPS. Loopback hosts (`localhost`, `127.0.0.1`, `[::1]`) default to HTTP: `void connect localhost:8787`. A scheme in the URL overrides either default.
- Cloudflare: Void signs in through the browser, picks an accessible account, and writes `cloudflare.account_id` to `void.config.ts` (or resolved state to `void.lock.json`). An existing selection is kept. Conflicting or inaccessible account settings stop the command; fix them, then rerun. `void cloudflare status` lists the accessible accounts and the deployment account.
- Platform: Void checks the connection, signs in through the browser, and stores the credential in the system keychain, one entry per platform origin.
- The destination and project link are written to `.void/project.json`. Connecting to another platform keeps an existing project link; the CLI says when the link or an environment override still points elsewhere. Pick the project with `void project link`.

Done when `void cloudflare status` (Cloudflare) or `void account whoami` (platform) names the identity you expect.

## 2. Connect without a terminal

A non-interactive shell cannot answer prompts. Pass a URL or `--platform`.

- Cloudflare needs usable credentials and one unambiguous account (`CLOUDFLARE_ACCOUNT_ID` when the token sees several).
- A platform needs `VOID_TOKEN` with a matching `VOID_API_URL`, or a valid keychain session for that origin.
- A URL in `VOID_API_URL` alone does not connect; deploying to a platform needs `void connect <url>` first.
- `void connect <url> --no-login` saves the verified connection without signing in. Platforms only.
- `void auth login|status|logout` need `--platform cloudflare|void` here, or call `void cloudflare ...` / `void account ...` directly. `void auth` never changes the deploy target; use `void connect` for that.

## 3. Sign in

Platform (`void account ...`):

- Run `void connect <url>` first, then `void account login` (browser, one of the platform's enabled methods). An older project link without a platform URL: connect, then `void project link` again.
- With no system keychain, login fails instead of writing a token file. Headless machines use `VOID_TOKEN` from a secret manager.
- `void account link [connection-id]` adds another login method to the current account. `void account logout` removes saved credentials.
- `void account token` copies your human token to the clipboard for interactive troubleshooting. It is not a CI credential (step 4).

Cloudflare (`void cloudflare login|status|logout`): sign in with these; no separate Cloudflare CLI is needed.

- An API token or global-key pair in the environment beats browser credentials. Explicit browser login then stops and names the variables; unset them in that shell, then sign in. `status` shows the active credential source; `logout` warns when environment credentials remain.
- Explicit browser login needs an interactive terminal.
- Signing in changes the browser session, not `account_id`. After switching users run `void cloudflare status`; when the new user cannot reach the pinned account, resolve the project's target before deploying.

Done when the status command of your target reports signed in with the credential source you intended.

## 4. CI

- Platform: set `VOID_TOKEN` and `VOID_API_URL` together from the CI secret manager (never committed; the URL must already be connected). In each fresh CI environment run `void connect "$VOID_API_URL" --no-login` before deploying. To use the saved login instead, unset `VOID_TOKEN`.
- The token must be a project deploy token, never a human token or `void account token`; also never pair a human token with a Cloudflare Access service token. Minting and rotating: `void-ci-deploy-credentials`.
- Name the project: `VOID_PROJECT`, `--project <slug>`, or a committed `.void/project.json`. The docs disagree on reach: `reference/cli.md` says `VOID_PROJECT` serves deploy, secret, domain and cache-purge commands; `reference/cli/project.md` and `github.md` also have `project team`, `zero-trust`, `github` and `build` resolve it. Assume the wider list.
- Cloudflare: set `CLOUDFLARE_API_TOKEN` as a secret (and `CLOUDFLARE_ACCOUNT_ID` for a multi-account token). Details: `void-direct-cloudflare-deploy`.

Done when the CI job defines the token, the URL, the project name and runs the `connect` line before any deploy.

Lint cannot see credentials. The `platform` rule family covers credentials written into source or workflow code.
