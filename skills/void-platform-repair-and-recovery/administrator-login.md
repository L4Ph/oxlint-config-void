# Administrator sign-in and Access health checks

Read this when the first administrator cannot sign in, the setup code expired, login settings are wrong, or install reports Default-Deny error 1050.

## Expired setup code

- Unfinished install: `void platform install --resume --name <id>`.
- Provisioning finished but administrator setup pending: `void platform repair <id>` **[REMOTE]**. Void prints a fresh setup code. Enter it at `/setup`, sign in, and confirm the displayed identity.
- An installation that already has an administrator does not reopen setup.

Done when the administrator is signed in.

## Sign-in fails after the setup code

The page shows the reason and an error code, and the callback URL the provider must have when a provider setting may be the cause.

| Error code                                                                  | Check                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `github_incorrect_client_credentials`, `github_failed`, `oidc_token_failed` | Client ID, client secret, and that the provider has the callback URL     |
| `github_redirect_uri_mismatch`                                              | The callback URL registered in the GitHub OAuth app                      |
| `oidc_discovery_failed`                                                     | The issuer URL, exactly, including any trailing slash                    |
| `github_unverified_user_email`                                              | Verify the primary email of the GitHub account                           |
| `google_domain_not_allowed`, `oidc_group_not_allowed`                       | Sign in with an allowed account, or change the allowed domains or groups |
| `login_denied`, `github_bad_verification_code`                              | Start a new sign-in                                                      |

If the provider shows its own error page, register exactly the callback URL printed with your setup code.

## Change login settings

Run on the computer that installed the platform. Login methods and Access protection stay as installed.

```sh
void platform repair <id>                        # interactive; saved values prefilled
void platform repair <id> --auth-config <path>   # install-format file; the way to change OIDC allowed groups
```

Leave the client secret blank to keep it. Repair prints a new setup code and the callback URL. A GitHub-only install uses the GitHub OAuth App from its install settings: to replace its client ID and secret, set `VOID_PLATFORM_GITHUB_CLIENT_ID` and `VOID_PLATFORM_GITHUB_CLIENT_SECRET` for the repair run. **[REMOTE]** Confirm the change with the operator, since it changes who can administer the platform.

## Access blocks the health check (error 1050)

Default-Deny (error 1050) means Cloudflare blocked the HTTP health check before it reached Void. This is separate from the API token used to deploy Workers; a Cloudflare management token does not authenticate an Access-protected HTTP request.

- Keep the company protection in place.
- Automatic Access setup saved scoped service credentials with the installation's encrypted recovery material. Resuming also creates or verifies an Access exception limited to `/health` on the reserved dispatch health hostname; Void still requires its private probe token there. It bypasses Access for no whole Worker and no deployed app.
- An existing gate: check that its service policy admits the installation token and that the application covers the printed API and proxy origins.
- Externally supplied credentials: set `VOID_ACCESS_CREDENTIALS` from your secret manager to an object keyed by each exact API/proxy origin, each entry holding `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, then rerun `void platform install --resume --name <id>`. Void keeps the saved resources and stops if the gate still rejects its checks. Account-wide Default-Deny and deployed-app policies remain the operator's responsibility.

Done when the resumed install passes its health check.
