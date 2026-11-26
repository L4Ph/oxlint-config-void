---
name: void-project-setup
description: Starts or adopts a Void project. Use when creating a new Void app, adding Void to an existing Vite app, running the void CLI for the first time (package manager, Node version, pnpm build approvals), after a fresh clone or in CI when .void types are missing (void prepare), or when setting up coding-agent instructions.
---

File layout and import shapes are the lint families `placement` and `imports`; this skill holds the order of the first commands and what each writes.

## 1. Run the CLI through the project

Install `void` in the project (`npm install -D void`, `pnpm add -D void`, `yarn add -D void`, `bun add -D void`, `vp add -D void`) so the CLI and the runtime have one version. Outside package scripts call it as `npx void`, `pnpm void`, `yarn void`, `bunx void` or `vpx void`; the docs write plain `void`.

The CLI needs Node.js 24.22+ or 26.12+. `npx`, `bunx` and package scripts use the `node` on `PATH` (so bun needs Node installed); `vpx` uses the version in `.node-version`.

Done when `void --help` prints the command list (it needs no sign-in or project).

## 2. Choose the starting point

- Empty directory: `void init` (step 3).
- Existing Vite app: `void init` in it (step 4).
- Meta-framework app (TanStack Start, React Router, SvelteKit and so on): follow its integration guide in `node_modules/void/docs/integrations/frameworks/` instead of the Void layout; see `void-app-shape-and-inference`.
- Legacy `void.json` or root `wrangler.jsonc`: read `migrate-and-info.md`.

Done when one path is chosen.

## 3. Scaffold a new project

Interactive `void init` asks for toolchain (Vite+ or Vite), framework, a starter (D1, PostgreSQL, MySQL or Static Pages) and a deploy target. A script or agent passes the answers as flags and skips the deploy sign-in:

```sh
void init --toolchain vite-plus --framework react --starter sqlite --deploy none
```

`--toolchain` takes `vite-plus` or `vite`; `--framework` `react`, `vue`, `svelte` or `solid`; `--starter` `sqlite`, `postgresql`, `mysql` or `static`; `--deploy` `cloudflare`, `void` or `none`. Run `void connect` later to sign in. Vite+ projects install through `vp install` without a global Vite+; existing package-manager versions and lockfiles are kept. `--git` initializes a repository without a prompt (CI needs it), `--no-git` skips it; workspace packages accept neither.

With pnpm, a blocked-build-scripts error is fixed by `pnpm approve-builds` for `esbuild`, `sharp` and `workerd`, plus `better-sqlite3: false` under `allowBuilds` in `pnpm-workspace.yaml` (Void ships its own binaries). `pnpm create void my-app` sets this up.

Done when `npm run dev` (or your manager's equivalent) serves `http://localhost:5173`.

## 4. Adopt an existing app

Commit or stash first: `void init` edits `package.json` dependencies and scripts and the Vite config (adding `voidPlugin()`). If it cannot edit the config it prints the snippet; add it by hand. Flags run single steps: `--tsconfig` adds Void types and keeps your settings (extend `.void/tsconfig.json`, or run it when an existing config already uses `extends`); `--github` writes the GitHub Actions deploy workflow (Cloudflare needs a `CLOUDFLARE_API_TOKEN` repository secret, PostgreSQL and MySQL also `DATABASE_URL`). Flags combine and skip the other wizard steps, but agent setup still runs.

Done when `git diff` shows only the edits you reviewed and `voidPlugin()` is in `vite.config.ts`.

## 5. Set up coding agents

Every `void init` run sets up agents. A new project gets a minimal `AGENTS.md` pointing at `node_modules/void/docs/`; in an existing project it asks before creating, appending or updating the file and keeps your text outside the Void section; CI and non-interactive runs leave existing instructions unchanged. Skills (`void`, `migrate-vite-cloudflare-to-void`) are linked into `.claude/skills/` or `.agents/skills/` for detected agents and track the installed package.

Agents read `node_modules/void/docs/` first (`guide/quickstart.md`, `reference/cli.md`) instead of relying on memory.

Done when `AGENTS.md` names `node_modules/void/docs/` and the linked skills resolve.

## 6. Generate types after a clone and in CI

`void prepare` writes `.void/` types and TypeScript configuration without starting the dev server or building. Run it after a fresh clone and after dependency install, before typechecking, in CI too. `vite dev` and `vite build` also generate them; `void env types` refreshes only `.void/env.d.ts`.

`.void/` is generated and gitignored, so never hand-edit it. The docs differ on one file: `reference/structure.md` calls `.void/` gitignored, while `guide/platform/installation/first-deployment.md` says to replace the `.void` line in `.gitignore` to commit `.void/project.json` (the link from `void project link`). Commit that one file only if a team needs a shared link.

Done when `tsc --noEmit` finds the `void/*` modules on a clean clone.

## 7. Know where files go

Handlers live under `routes/` (`routes/api/users.ts` serves `/api/users`) and page components under `pages/` (`pages/users/index.tsx` renders `/users`); the path is the URL. Other convention directories: `db/`, `email/`, `crons/`, `queues/`, `durable-objects/`.

Done when each new file sits in the directory its role names.
