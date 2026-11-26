---
name: void-deploy-github-integration
description: "Connects a Void project to GitHub so pushes deploy, covering `void github link|install|join|connect|update|disconnect`, container builds versus a GitHub Actions workflow, `void init --github` and `void build logs`. Use when setting up deploy-on-push, changing the branch or executor, switching repositories, or reading build logs."
---

# Deploy on push with GitHub

Pick by target first:

| Target | Route |
|---|---|
| Void platform with managed GitHub builds | `void github ...` below. The platform builds, or a workflow you authorize does. |
| Void platform, core self-hosted install | Not available (no managed builds, no OIDC workflow). Deploy from your own CI: `void-ci-deploy-credentials`. |
| Direct Cloudflare | `void init --github` writes a workflow; see step 5. |

`void github connect` and `disconnect` change what happens on every push to a production project. Run them only when the user asked for that, with the branch and repository stated.

Project for `github` and `build` commands: the `[project]` argument or `--project`, then `VOID_PROJECT`, then the linked project.

## 1. Link GitHub and install the App

1. `void github link` ties your signed-in Void account to a GitHub identity through the browser. One GitHub identity belongs to one Void account; if it is linked elsewhere, sign in to that account or authorize a different GitHub identity. `void github install` runs `link` for you when needed.
2. `void github install` opens the GitHub App install page.
3. Organization installation that already exists: `void github join` (browser; the platform must enable organization-installation sharing). `connect` does this by itself in an interactive terminal; run `join` locally before any non-interactive setup.
4. `void github installations` lists installations with the `[id: <installation_id>]` that `--installation` takes.

Done when `void github installations` lists the installation you will connect.

## 2. Choose executor and branch

- `container` (default): the platform builds. Logs are readable with `void build logs`.
- `github_actions`: a deploy workflow in your repo builds with a short-lived OIDC token. The workflow file must be `.yml` or `.yaml` under `.github/workflows/` (default `.github/workflows/void-deploy.yml`) and only that file can obtain the project's token, so use a dedicated deploy workflow, not a general one. Keep `permissions: id-token: write` in it and set the repository's `VOID_API_URL`.
- The branch is a decision: every push to it builds and deploys production. Name it explicitly.

## 3. Connect

`void github connect [project] --installation <id> --repo <owner/repo> --branch <name> [--executor container|github_actions] [--workflow <path>]` **changes remote state:** from then on every push to that branch deploys. It fails when the project already has a connection (one per project).

- Interactive runs prompt for what you omit. Non-interactive runs need `--branch` (required) plus `--installation` and `--repo` when the CLI cannot choose them. An organization connection needs the repository authorized in a local browser first.
- You can connect only repositories your GitHub account can access.
- For `github_actions`, authorize the repository with `void github connect <project> --repo <owner/repo> --executor github_actions`; the workflow then gets short-lived OIDC credentials.

Done when `void github status [project]` shows the repository, branch, executor and workflow you chose.

## 4. Change or remove the connection

- `void github update [project]` changes only branch, executor or workflow. In CI pass at least one of `--branch`, `--executor`, `--workflow`. It cannot change the repository.
- To use another repository: `void github disconnect`, then `connect`.
- `void github disconnect [project]` **destroys the connection:** automatic deploys stop and in-flight builds of the project are cancelled before it is removed. Confirm first that no build you need is running and the user asked for it. It prompts; `--yes` skips the prompt and is required in non-interactive shells. A project with no connection reports that and exits successfully.

## 5. Direct Cloudflare workflow

`void init --github` generates a GitHub Actions workflow for the saved target and package manager. Run alone it skips the other wizard steps. For Cloudflare add the repository secret `CLOUDFLARE_API_TOKEN`, and `DATABASE_URL` for PostgreSQL or MySQL apps. Worker preview URLs and Access credentials: `void-direct-cloudflare-deploy` (its `ci.md`). If CI typechecks, run `void prepare` after installing dependencies.

## 6. Read build logs

`void build logs [build] [--follow] [--output <file>] [--project <slug>]` prints the latest build when `[build]` is omitted. It covers **container** builds only; for `github_actions` it prints the Actions run URL and the logs stay on GitHub. A container build keeps only its last 10,000 lines.

`--follow` waits for the platform to confirm the final tail. If it cannot confirm, upgrade the platform runtime or read the retained logs without `--follow`. An unfinished final tail errors after two minutes; run it again.
