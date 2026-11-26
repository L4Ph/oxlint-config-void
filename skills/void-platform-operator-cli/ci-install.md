# Installing and maintaining a platform from CI

Use after a first interactive installation (`void platform install` in a terminal). CI automates a configured installation; it does not replace the first setup.

## Inputs

Inject every value from protected CI secrets. Never commit them in a workflow or a plaintext secrets file. The variable table is in the CI install docs page (`guide/platform/installation/ci.md`); the rules that the table does not show:

- Existing Hyperdrive: set its ID, the runtime user, and either the origin host (public database) or the Workers VPC service ID (private database), never both. `VOID_PLATFORM_DATABASE_URL` carries a database owner connection so Void can apply migrations.
- Login: default GitHub-only needs `VOID_PLATFORM_GITHUB_CLIENT_ID`, `VOID_PLATFORM_GITHUB_CLIENT_SECRET` and `VOID_PLATFORM_ADMIN_GITHUB_LOGIN`. For Google, OIDC or Access pass `--auth-config <path>` and inject each `clientSecretEnv` the file names from the secret manager. Automatic Access protection may also need `VOID_PLATFORM_ACCESS_SETUP_TOKEN`.
- Keys: reuse the installation's original JWT signing secret and project-encryption key on every resume or repair that needs them. A different installation gets a fresh database; the database claim and tables remain after uninstall.
- Email: set both `VOID_EMAIL_SENDER_DOMAIN` and `VOID_EMAIL_SHARED_ZONE_ID`, or neither. Later upgrades reuse recorded values; an email-enabled installation with none recorded needs both before upgrading.
- A login provider's OAuth or OIDC client created by hand needs `<platform-api-url>/auth/callback` registered. Automatic Access setup manages its own application.

## Preview then apply

1. Run `void platform install ... --plan` with the same account, name and domain options as the unattended install, the same `--auth-config` file if any, and `--runtime <directory>` for a custom runtime. A read-only `--plan` needs no `--yes`.
2. **[REMOTE]** (installs or changes the platform's Workers and resources): the same command with `--yes`. Mutations require `--yes` in CI.

## When CI stops

`upgrade`, `repair`, `enable`, `rollback` and `install --resume` stop before they change a platform Worker or pause traffic when a platform Worker was changed in the Cloudflare dashboard or API, or has an active version with no Void deployment record. `--yes` runs stop at the same approval. Preview the affected Workers with `--plan`, then run the printed command once in a terminal and answer the prompt "Replace the configuration of these Workers?" (default No).

**[IRREVERSIBLE] Accepting discards manual changes:** it restores Void's configuration, including removing manually added variables. Confirm with the operator that nothing outside Void depends on those edits. A later prompt shows the configuration differences; declining it leaves any resource and database preparation in place. If a Worker uses a gradual deployment, first set one version to 100 percent of traffic in Cloudflare. Then resume the automation. Done when the CI run passes without stopping.
