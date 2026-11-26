---
name: void-remote-dev
description: Runs local Void code against a deployed project's real D1, KV and R2 (remote mode). Use when enabling `remote: true` or VOID_REMOTE, investigating an issue with production data, or when a remote-mode call to R2 or D1 fails or behaves differently than locally.
---

Remote mode keeps the local dev server but sends `db`, `env.KV` and R2 calls to the deployed project's resources, with no application code change. Config literals are the lint family `config`; this skill holds the safety steps.

## 1. Point it at staging

Writes and deletes in remote mode change real data; nothing is isolated. Use a staging project when one exists. For a production project, confirm with the owner that real writes are acceptable, and keep sessions short.

Done when you can name the project the session will hit and it is staging, or its owner agreed.

## 2. Meet the prerequisites

1. Connect to the team's platform: `void connect <url>` (it signs you in when needed; `reference/config.md` names `void account login` for the same requirement).
2. Link the project: `void project link` (saves the choice in `.void/project.json`; check it names the staging project).
3. Deploy the project at least once so its resources exist.

The docs describe remote mode for a project deployed to a Void platform. They do not say whether a project deployed straight to your own Cloudflare account works; try it and read step 4's banner before trusting it.

Done when `.void/project.json` names the intended project and the project has been deployed.

## 3. Turn it on, preferring the one-off

- One run: `VOID_REMOTE=1 vite dev` (or `VOID_REMOTE=1 pnpm dev`). Nothing is committed, and it ends with that shell command.
- Persistent: `remote: true` in `void.config.ts`. Every `dev` start from then on hits live data, and once committed it does so for everyone who checks the repository out.
- `VOID_REMOTE=0` disables it even when the config says `remote: true`.

Only D1 (`DB`), KV (`KV`) and R2 (`STORAGE`) switch to remote. AI is proxied through the platform account in both modes.

## 4. Check it is active

On start the dev server prints (with arrow characters):

```
[void] Remote bindings active
         DB      -> remote D1
         KV      -> remote KV
         STORAGE -> remote R2
```

Done when that banner shows each binding the app uses. A missing banner means local data; stop before any write.

## 5. Stay within what remote mode supports

Each binding call is a network request, so responses are slower. Read `limitations.md` before using R2 multipart, range or conditional reads and writes, R2 metadata or list options, `db.dump()` or `db.batch()` in a remote session.

## 6. Turn it off

Remove `remote: true`, or run without `VOID_REMOTE=1`. Done when the next `dev` start prints no banner and local data is used again.
