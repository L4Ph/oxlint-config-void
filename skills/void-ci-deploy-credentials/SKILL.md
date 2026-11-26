---
name: void-ci-deploy-credentials
description: "Gives CI the credentials to deploy a Void project, covering project tokens (`void project token create|list|renew|revoke`), VOID_TOKEN with VOID_API_URL, VOID_PROJECT, Cloudflare Access credentials and CLOUDFLARE_API_TOKEN. Use when setting up, rotating or revoking CI deploy credentials, or when a CI deploy is refused."
---

# Credentials for CI deploys

Pick the path by target:

| Target                                            | CI credential                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Void platform, core self-hosted                   | A project token (steps 2-5) used from your own workflow. No generated GitHub workflow exists for this install. |
| Void platform with the GitHub Actions integration | Short-lived OIDC credentials, no stored token: `void-deploy-github-integration`.                               |
| Direct Cloudflare                                 | `CLOUDFLARE_API_TOKEN` (step 6).                                                                               |

## 1. Who may mint

Only the project owner creates, lists, renews and revokes project tokens. A token deploys unattended as the billing owner and outlives any member's login session, so collaborators and project administrators deploy with their own account instead. If you are not the owner, stop and ask the owner.

`create`, `renew` and `revoke` **change remote credentials.** Run them only when the user asked for that action. Confirm first that the CI secret store is within reach, because `renew` and `revoke` stop the old token at once.

## 2. Create a token

`void project token create --name <name> --expires-in <days>` (add `--project <name>` outside a linked project).

- Expiry is 1 to 90 days. Choose the shortest the rotation routine can meet.
- The command prints `VOID_TOKEN` and `VOID_API_URL` once. Put both in the CI secret manager, never in a workflow file or the repo.
- The token can call only the endpoints `void deploy` uses: no operator or account routes, no secret writing, no project deletion, no other projects. A human token (`void account token`, a login) is never a CI credential, with or without a Cloudflare Access service token.

Done when `void project token list` shows the credential and the secret manager holds both values.

## 3. Use it in CI

In each fresh CI environment, before `void deploy`:

```sh
void connect "$VOID_API_URL" --no-login
void deploy --platform void --project "$VOID_PROJECT"
```

- Set `VOID_TOKEN` and `VOID_API_URL` together; the URL must already be connected, and neither they nor project files replace the connect line.
- CI cannot answer the project prompt (without a project, `void deploy` errors out). Choose the project with `VOID_PROJECT`, `--project <slug>`, or a committed `.void/project.json` from `void project link`. New apps ignore `.void` in `.gitignore`; to commit the link replace that line with `.void/*` and `!.void/project.json`.
- Typechecking in CI: run `void prepare` after installing dependencies.

Done when the CI run reaches the platform and the deployment starts.

## 4. Behind Cloudflare Access

The Access service-token pair passes the perimeter; the project token authorizes the deploy. A service token alone authorizes nothing, and it does not grant Void user or operator authority.

A deploy that prerenders or uses remote proxy bindings calls both the API and the proxy. Store `VOID_ACCESS_CREDENTIALS` as one origin-keyed JSON secret with an entry for each exact HTTPS origin, even when the same pair serves both:

```json
{
  "https://<api-origin>": { "CF_ACCESS_CLIENT_ID": "<id>", "CF_ACCESS_CLIENT_SECRET": "<secret>" },
  "https://<proxy-origin>": { "CF_ACCESS_CLIENT_ID": "<id>", "CF_ACCESS_CLIENT_SECRET": "<secret>" }
}
```

Use distinct pairs when the two Access policies require it. Leave `VOID_ACCESS_ORIGIN` unset for such deploys: it scopes one origin, and naming only the API origin does not authorize proxy calls.

## 5. Rotate and revoke

- `void project token renew <credential-id> --expires-in <days>` **destroys the previous token in the same operation** and prints the new one once. Replace the CI secret immediately; every CI deploy fails in between.
- `void project token revoke <credential-id>` **destroys the token**; CI deploys that use it stop. Revoke a leaked token first, then create a replacement.
- Tokens also stop when the project is deleted, when the owner is suspended, and when an installation administrator transfers ownership (all existing tokens are revoked; the new owner creates replacements; the former owner becomes a project administrator and cannot).
- Disabling a login method does not revoke project tokens.

Done when the next CI deploy succeeds with the new secret, or `void project token list` no longer shows the revoked ID.

## 6. Direct Cloudflare

Add `CLOUDFLARE_API_TOKEN` to the repository secrets, plus `DATABASE_URL` for PostgreSQL or MySQL apps. Token permissions, `CLOUDFLARE_ACCOUNT_ID`, Access readiness: `void-direct-cloudflare-deploy` (its `ci.md`). The `platform` lint family flags credentials written into source or workflow code.
