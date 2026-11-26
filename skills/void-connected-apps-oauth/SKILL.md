---
name: void-connected-apps-oauth
description: Connects an external app builder to a Void platform over OAuth. Register the client, sign users in, refresh tokens, build private previews, publish with user approval. Use when registering or disabling a connected app, writing its OAuth client, debugging a refresh or preview launch failure, or preparing a deployment with prepareDeployArtifact.
---

# Connected apps (OAuth) on a Void platform

A connected app is a separate application registered as an OAuth client on a Void installation. Users sign in on Void and decide whether to connect it. The app operator and the platform administrator may be different people. Endpoints are listed at `/.well-known/oauth-authorization-server` on the platform API origin.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. Run a marked step only when the operator asked for it in this session. Approving a publish is the end user's decision on Void's page; never approve for them.

## 1. Register the client (administrator, Admin UI)

**[REMOTE].** Admin, then Connected apps: enter the app name, its operator, and each exact HTTPS callback URL on its own line. Wildcards and callback query strings are not supported. Enable individual publish approvals if the app builds and deploys; enable private previews to run checkpoints before publishing. For an existing client, the **Enable private previews** button turns previews on, and users must connect again to consent.

- Void shows the secret once. Store client ID and secret on the app's server only: not in the browser, not in the repository. The secret authenticates the app; it grants no access to users' accounts.
- Local development may use exact `http://localhost` callbacks only when the platform's development authentication bypass is enabled. Production clients require HTTPS.
- Replace credentials by registering a new client, switching the app over, then disabling the old one.
- **[IRREVERSIBLE]:** **Disable and revoke access** invalidates the client's grants, pending sign-ins and publish approvals, and denies later preview views. Confirm the operator wants every user disconnected. Registration and disablement appear in the operator audit. Disabling does not remove an app already published; manage that project through Void.

Done when the app's server holds the client ID and secret and the callbacks listed in the Admin page equal the ones the app sends.

## 2. Sign users in

Use authorization code flow with `scope=profile`, a random `state` and S256 PKCE. Authenticate token exchanges with HTTP Basic client authentication. Call `/oauth/userinfo` with the Bearer access token: it returns `sub`, `preferred_username` and the consented `scope`. Void issues no OpenID Connect ID token. Sign-in reads the user's ID and username only; it gives no account token and no project management access.

Done when `/oauth/userinfo` returns `sub` for a test user.

## 3. Keep the tokens alive

Access tokens last one hour. The refresh token renews them for up to 30 days after the user's original sign-in; after that, or when the user revokes the sign-in or the account is suspended, send the user through sign-in again. Users disconnect apps at `<platform API URL>/oauth/connections`.

1. POST `grant_type=refresh_token` and the `refresh_token` to `/oauth/token`, with client Basic authentication.
2. Replace the stored access and refresh token pair with the response.

Send one refresh at a time per connection. Each refresh token works once; reusing it revokes the connection, and the user must reconnect. Pass a space-separated `scope` to ask for fewer permissions; later refreshes cannot restore dropped ones. `deploy:approve` tokens carry no refresh token.

Revoke a connection with `POST /oauth/revoke`, authenticated as the client, with either token.

Done when two concurrent requests share one refresh (a lock per connection) and the code stores the new pair before using the new access token.

## 4. Private previews

Sign-in can request `scope=profile preview:deploy` once the administrator enabled previews and the user consented. Previews need no approval per checkpoint. Production publishing still does.

1. POST `{ workspace: externalWorkspaceId }` to `/oauth/previews`. The response has a stable `project_id` and preview `url`, per client, owner and workspace.
2. POST `{ project_id, checkpoint, artifact: prepared.artifact }` to `/oauth/preview-deployment-requests` (artifact from step 5). Use its `access_token` and `approval_id` with the same upload and deployment calls as publishing.
3. When the deployment finishes, POST `/oauth/previews/:id/launch` and open the returned URL at once: it works once and expires after one minute. Reload the preview's origin after opening it.

What a preview is: its own origin and resources, no production secrets, HTTP apps with isolated D1, KV, R2, AI and native Durable Objects. Authentication, external databases, email, schedules, queues and containers need a production publish. Viewing needs the current user grant. Preview writes must come from the preview's own origin.

Limits: ten preview workspaces per owner; sixty builds per workspace per hour; owner's platform limits are shared. Inactive previews expire after seven days (opening via `/oauth/previews` renews); disabling preview permission expires them all.

If the platform sits behind Cloudflare Access, the account's Access policies must let generated preview origins reach Void (a policy that blocks new Workers hostnames blocks previews), and the connected app's server needs a service identity permitted by the platform API's Access policy. Server OAuth endpoints still check client, grant and project authority; browser consent needs the user's company identity.

Done when the launch URL opens the preview, or a failure names which of the three calls refused.

## 5. Publish to production

1. Build in managed mode inside the isolated environment, then call `prepareDeployArtifact`. Read `prepare-artifact.md` for both.
2. POST the artifact to `/oauth/deployment-requests` with the profile token: `redirect_uri` (a registered callback), `state`, `code_challenge`, `code_challenge_method: 'S256'`, `slug`, `checkpoint`, `artifact`.
3. Redirect the browser to the returned `authorization_url`. Void shows project name, checkpoint, resources, manifest and artifact digest. The user approves there. Do not request `deploy:approve` in an ordinary sign-in: it authorizes nothing; this publish flow is a Void extension.
4. Exchange the returned code with the publish verifier and the same registered callback. The response has `project_id`, `approval_id` and a `deploy:approve` access token, valid for up to fifteen minutes and limited to this artifact's asset uploads, deployment and receipt. It cannot read secrets, mint project tokens, delete projects or deploy different bytes.
5. `POST /projects/:id/deploy/upload-urls`, upload the declared assets, then `POST /projects/:id/deploy` with `x-void-deploy-idempotency-key` set to `approval_id`. Retries reuse the same receipt. Deployment needs the platform deployment Queue.

**[REMOTE] [IRREVERSIBLE] (step 4 onward):** an approval permits one deployment that runs with the project's existing secrets and resources, and migrations and resource changes in the approved manifest take effect during it. Void creates a missing project at approval; an existing project requires ownership. Before the user approves for an existing project, confirm they see the app operator and the deployment details, and that the artifact is the one you prepared. Disabling the app or disconnecting the grant stops later actions and is checked again before a queued deployment publishes.

Done when the deploy response for that `approval_id` reports success.
