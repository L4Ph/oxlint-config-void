# Secret commands: targets, sync, conflicts

Read when using `void secret sync`, a hosted (Void platform) project, or a secret write that fails.

## Which target a command hits

Secret commands use the destination saved in `.void/project.json`.

- Direct Cloudflare target: the Worker named in `void.config.ts`. `--project` is rejected; the pinned root Cloudflare config decides.
- Hosted project: resolution is `--project`, then an environment variable, then the linked project (the same order as deploy). `--project` is hosted-only.

Done when `void secret list` shows the names you expect for the intended project.

## Bulk upload with void secret sync

REMOTE WRITE: uploads every entry of the file to production, replacing same-named secrets. Secrets absent from the file are kept, so a sync never deletes.

```sh
void secret sync /secure/path/production.env      # --yes skips the confirmation, for CI
```

- Keep the file outside the project (it is plaintext) and delete it after use.
- Include only server keys declared in `env.ts`, each with a value that passes validation. Leave out local development credentials and `VITE_*` values; a `VITE_` key or an undeclared key is rejected.

Confirm before running: the file path is outside the repo, every key is in `env.ts`, `void secret list` shows the intended target.

Done when `void secret list` shows every key of the file.

## Write or delete returns a conflict

On a hosted project a secret write or delete returns a retryable conflict while a deployment or rollback runs. Wait for it to finish (`void project status`), then retry. The rejected operation left the stored secret unchanged.
