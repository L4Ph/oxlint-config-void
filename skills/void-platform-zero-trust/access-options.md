# Access options at install time and for scripts

App protection uses the Cloudflare account that hosts the platform. If platform login or protection uses another account, select equivalent identity providers and policies in the hosting account when prompted. Keep the platform API on the application domain's apex or on a `workers.dev` hostname so it stays outside the app wildcard.

## The three installer choices

- Same people allowed by the platform's Access policy: reuses your company identities and policies. Recommended when platform Access protection is on.
- Anyone (public apps).
- A different Access policy: separate company rules for apps. Without platform protection this reads "Set up Cloudflare Access protection".

The installer finishes and verifies app access before it opens application traffic; new projects inherit the choice. If setup stops, use the printed resume command.

## Public apps under account-wide Default-Deny

Void creates scoped public rules for each app and its verified custom domains. Other subdomains keep their rules; Default-Deny stays on; the platform API and proxy are not bypassed. Keep these rules enabled while Default-Deny is on: removing them can block traffic. Public-only installations need no identity providers or policies until you protect apps.

- Configure or renew public-only rules: `printf '%s' "$ACCESS_API_TOKEN" | void platform zero-trust configure --public-apps --token-stdin --plan`, then `--yes` (**[REMOTE]**). When enabling from a disabled configuration add `--existing-projects public`.
- Public-only rules cannot be combined with protected project choices. To switch a protected configuration to public-only, disable it first (`recovery.md`). **[IRREVERSIBLE]** protection, and Access may block traffic during the transition in a Default-Deny account; confirm a maintenance window.

## Tokens

- The app-management token needs Access: Apps and Policies Edit, and Organizations, Identity Providers, and Groups Read. Void stores it encrypted for later app and domain changes. The Zero Trust docs page calls the same permission "Apps and Policies Write"; the docs use both names, treat them as one permission.
- The Access setup credential needs Apps and Policies Write, Organizations, Identity Providers, and Groups Read, and Service Tokens Write, in the identity account. For an identity account other than the installation account, supply a token scoped to it.
- The platform runtime token needs no Access management permissions. Scripts can override the setup token with `VOID_PLATFORM_ACCESS_SETUP_TOKEN`.

## Scripts

Use `--app-access public|platform|custom`, with `VOID_PLATFORM_APP_ACCESS_TOKEN` when app rules are needed, or an `appAccess` section in the `--auth-config` file (`mode`, `identityProviderIds`, `policyIds`, `tokenEnv`). Keep the file's existing `connections`. Headless setup requires an explicit app-management token; it never retains an installer-only token.

## Which policies are accepted

An Allow policy must name who may sign in: emails, email domains or lists, identity-provider groups, authentication contexts, Cloudflare account members, or Access groups built from them. Void rejects policies that allow everyone, any service token or bypass Access, and policies that rely only on One-time PIN, a public login such as GitHub, or a generic OpenID Connect or SAML login (even one fronting a company directory). For a generic login, add a Require rule such as "Emails ending in" your company domain.

## Existing Access applications

For applications your company manages, scripts use `mode: "existing"` with optional `accountId`, `loginApplicationId` and/or `protectionApplicationId`. Supply `serviceToken` (`id`, `clientIdEnv`, `clientSecretEnv`) for a token the application already admits. The selected policies must cover both the printed API origin and the printed proxy origin. Void needs read access to their applications, policies, organization, identity providers, groups and service tokens, and leaves their policies unchanged.
