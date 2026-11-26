# CI for a fork

Read this when you deploy source builds from CI, or set up a fork's platform compatibility checks.

## Deploy source builds from CI

Build `@void/platform` from your checkout and pass its runtime directory with `--runtime` to `install`, `upgrade`, `repair`, `enable` or `rollback`. Use a clean Git checkout, or set `VOID_PLATFORM_SOURCE_REVISION`. A fresh runner discovers the installation each time.

Put these in a protected environment, never in the workflow file: `CLOUDFLARE_API_TOKEN` (management token), `VOID_PLATFORM_DATABASE_URL`, the JWT signing secret, the email signing secret for email-enabled installs, and the complete project-encryption keyring. Upgrades inherit deployed Worker secrets; the originals are needed to recreate a missing Worker and to rotate credentials explicitly.

```sh
vp run build:core
export VOID_PLATFORM_REGISTRY_DIR="$RUNNER_TEMP/void-platform-registry"
export VOID_PLATFORM_RECOVERY_KEY="$(openssl rand -base64 32)"
node packages/void/dist/cli/cli.mjs platform discover --account "$CLOUDFLARE_ACCOUNT_ID" --installation "$VOID_PLATFORM_INSTALLATION"
node packages/void/dist/cli/cli.mjs platform upgrade "$VOID_PLATFORM_INSTALLATION" --runtime packages/platform/dist/runtime --plan
node packages/void/dist/cli/cli.mjs platform upgrade "$VOID_PLATFORM_INSTALLATION" --runtime packages/platform/dist/runtime --yes   # [REMOTE]
```

Omit the installation selector only when the account has one discoverable installation. Run one deployment per installation at a time (SKILL.md step 5). A per-run recovery key is valid only because every original credential stays in the protected environment.

CI stops, rather than changing a Worker or pausing traffic, when a platform Worker was changed in the dashboard or API, or has an active version without a Void deployment record. Run the interactive command once (`void-platform-repair-and-recovery`), then resume automation.

Done when the plan step prints without error and the `--yes` step exits 0.

## Compatibility checks in a fork's CI

The uncredentialed test workflows run on GitHub-hosted runners and need no Void Cloud accounts or tokens.

- If the fork has a released platform version, set the repository variable `VOID_PLATFORM_PRODUCTION_REF` to its immutable 40-character commit SHA. Platform pull requests then create that version's database, seed representative user, project and encrypted-secret records, apply the proposed migrations, verify the existing data, and run the previous runtime against the upgraded schema. Branch and tag names are rejected.
- Without an explicit SHA, required compatibility checks use the latest successful GitHub deployment to `Prod` (or `VOID_PLATFORM_PRODUCTION_ENV`). They stop if no completed deployment exists. Advancing the production branch does not change that baseline.
- Workflows that call platform CI must grant `deployments: read` alongside `contents: read`.
- Build your own release workflow around the built CLI and `platform upgrade --runtime`; the upstream workflows that deploy Void Cloud and publish npm packages are not for forks. Keep production credentials in protected environments restricted to the release refs.

Done when a pull request that changes migrations runs the compatibility check against your baseline and passes.
