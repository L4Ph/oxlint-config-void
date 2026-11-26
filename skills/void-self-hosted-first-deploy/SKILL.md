---
name: void-self-hosted-first-deploy
description: "Does an app's first deploy to a self-hosted Void platform and names what that platform lacks. Use when targeting a self-hosted Void platform for the first time, or when a hosted feature (user dashboard, managed GitHub builds, email, custom domains, Sandboxes) is missing there."
---

# First deploy to a self-hosted platform

For app authors. Installing the platform is the administrator's job and is not covered here. You need the platform's API URL from the administrator (opening it in a browser shows a welcome page with CLI connection instructions).

## 1. Use a fresh app directory

An app already linked to another platform keeps that destination, so a first test there deploys to the wrong place. Start from a new app directory, or a checkout without `.void/project.json`.

Done when `.void/project.json` does not exist in the directory you will deploy from.

## 2. Connect, then deploy

1. `void connect <api-url>` validates the platform and signs you in through the browser. Credentials go to the system keychain, one entry per platform URL. More: `void-connect-and-login`.
2. `void deploy --platform void --project <slug>` **changes remote state:** it creates the project on the shared platform (the CLI asks you to confirm creation) and publishes the app into the platform's Cloudflare account. Run it only when the user asked for this deploy; confirm the URL and slug first. To use a project that already exists, run `void project link` instead and then `void deploy`.
3. Once the platform accepts the deployment it runs independently of the CLI. Check it with `void project status`; stop it with `void project cancel`. Timeouts and rollback: `void-deploy`.

The administrator login (`void platform auth login`) is separate from deploy credentials; an app author does not need it.

Done when deploy prints the deployment URL and `void project status` lists the deployment.

## 3. Commit the project link

New apps list `.void` in `.gitignore`. Replace that line with:

```
.void/*
!.void/project.json
```

Commit `.void/project.json`. CI needs it, or `VOID_PROJECT` (`void-ci-deploy-credentials`).

Done when `git status` shows `.void/project.json` as a tracked or new file.

## 4. What a standard install lacks

The core platform runs the same application APIs as direct Cloudflare: static sites, SPAs, Pages SSR, routing, WebSockets, queues, cron, ISR, D1, KV, R2, Workers AI, Durable State, with retained logs and deployments in place of the live tail and Worker versions. Beyond that:

| You want                              | State on a standard install                                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User dashboard, managed GitHub builds | Not included. A custom platform build provides them (`guide/platform-development`). No `void github` managed builds; deploy from your own CI with a project token (`void-ci-deploy-credentials`). |
| Email                                 | The operator must configure a shared mail domain and zone.                                                                                                                                        |
| Custom domains                        | The operator must install with `--custom-domains`.                                                                                                                                                |
| Sandboxes                             | The platform account must be on Workers Paid.                                                                                                                                                     |

Features depend on the installation's configuration, so when one is missing ask the administrator which of these the installation enables before changing app code. The platform itself needs Workers for Platforms and the documented Cloudflare infrastructure; that is the administrator's side.
