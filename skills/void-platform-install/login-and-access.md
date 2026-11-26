# Login methods, Access and app access

Read this at step 2 of the install: when you set up any login method, Cloudflare Access login or protection, app access, or `--auth-config`. Full JSON examples: `node_modules/void/docs/guide/platform/installation/setup.md`.

## Callback URL

`--plan` prints the login callback, `<platform-api-url>/auth/callback`. Register exactly that URL when you create an OAuth or OIDC client by hand. Automatic Access setup manages its own application. The first administrator sign-in page shows the callback again when a provider setting may be wrong.

## GitHub OAuth App

1. Open GitHub's new OAuth App form (the installer opens it) while signed in as the account that will own the integration.
2. **Application name**: the platform display name. **Homepage URL**: the API URL Void printed.
3. **Redirect URI** (Authorization callback URL): the exact printed URL ending in `/auth/callback`. It is pinned in the saved draft and stays the same if setup is interrupted.
4. Save the **Client ID**, generate a **Client Secret**, and save both in the password manager.

Done when both values are saved and the registered callback equals the printed one character for character.

## Google and OIDC

- Google: create an OAuth client, register the printed callback, optionally restrict it to named Google Workspace domains.
- OIDC or Access login: provide the issuer URL, client ID and client secret. Select **Company-approved users** when the company policy should let colleagues create accounts without individual invitations.
- Access login alone can connect to another Cloudflare account with only issuer, client ID and secret (no `cloudflareAccess` block, no management token). Follow Cloudflare's generic OIDC SaaS application guide and register the exact callback Void printed.

No GitHub account is needed for a Google-only or OIDC-only install.

## Cloudflare Access protection

Choose Access login, platform protection, or both. Protection can be combined with GitHub or any other login.

- Your identity provider decides how employees sign in; your Access policies decide who reaches the platform and which MFA or device rules apply. Void uses an existing Zero Trust organization, the identity providers and company policies you select, creates dedicated applications and a scoped service token, and preserves your policies.
- No fitting policy: pick **Allow my company's email domain** and enter domains (Void creates and keeps that Allow policy). For provider groups or other rules pick **Create in Cloudflare** and follow the printed steps.
- An Allow policy must name who may sign in: emails, email domains or lists, identity-provider groups, authentication contexts, Cloudflare account members, or Access groups built from them.
- Void rejects policies that allow everyone, any service token, or bypass Access, and policies that rely only on One-time PIN, a public login such as GitHub, or a generic OpenID Connect or SAML login (Void cannot tell who can sign in through it). For a generic login add a Require rule such as **Emails ending in** your company domain.
- Setup credential: **Access: Apps and Policies Write** and **Organizations, Identity Providers, and Groups Read** in the identity account, plus **Service Tokens Write** for protection. In the installation account the management token already carries them. For applications in another account, give a token scoped to that account (scripts: `VOID_PLATFORM_ACCESS_SETUP_TOKEN`).
- Existing applications: select **Use Access applications your company already manages**. The selected policies must cover both printed API and proxy origins. Void leaves their policies unchanged.
- The Access application must also cover the dashboard origin if one is configured (`domains.md`).

Done when the plan lists the Access applications and policies you selected and shows no rejected-policy message.

## App access

Prompt: **Who should be able to access deployed apps?**

- **Same people allowed by the platform's Access policy**: recommended when platform protection is on.
- **Anyone - public apps**: default without protection.
- **Choose a different Access policy**: separate rules for apps; scripts use `--app-access public|platform|custom`.

The plan shows the default; Void finishes and verifies it before opening traffic, and new projects inherit it. App protection uses the account that hosts the platform: when login or protection lives in another account, select equivalent identity providers and policies in the hosting account. Keep the API on the app domain's apex or a workers.dev hostname so it stays outside the app wildcard.

In an account with Default-Deny, public apps get per-app Access rules (and rules for their verified custom domains); Void leaves Default-Deny enabled and does not bypass the platform API or proxy. Those rules need **Access: Apps and Policies Edit** and **Organizations, Identity Providers, and Groups Read**, and Void stores that management token encrypted for future apps and domains. Scripts supply `VOID_PLATFORM_APP_ACCESS_TOKEN` or `appAccess.tokenEnv`; headless setup never silently retains an installer-only token.

## Scripted login configuration

`--auth-config <path>` takes a JSON file. Keep only nonsecret configuration in it and name secrets by environment variable (`clientSecretEnv`, `tokenEnv`); supply the secrets from your secret manager when you apply. `--plan` reads the file without the secrets. Pass the same file to the plan and the install. Skeleton, with `connections`, `administratorConnectionId` and `admission`:

```json
{
  "connections": [
    {
      "configuration": {
        "id": "google",
        "kind": "google",
        "label": "Company Google",
        "clientId": "<id>"
      },
      "clientSecretEnv": "GOOGLE_CLIENT_SECRET"
    }
  ],
  "administratorConnectionId": "google",
  "admission": { "mode": "company", "connections": ["google"], "access": false }
}
```

Add `"protection": true` and a `cloudflareAccess` block (`mode: "create"`, `identityProviderIds`, `policyIds`) for Access protection; add `appAccess` for app access.
