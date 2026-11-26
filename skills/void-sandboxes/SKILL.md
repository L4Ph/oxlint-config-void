---
name: void-sandboxes
description: Runs code in a Void Sandbox (isolated Cloudflare container) with getSandbox - commands, files, servers, custom images, usage limits. Use when adding sandboxed execution, building a custom sandbox image or size, or when sandbox state disappears, commands stop, or a 429 arrives.
---

Import `getSandbox` from `void/sandbox`; the import enables the container resources. Lint (`resources` family) checks call shapes (argument arrays, cwd, id length, output decoding); this skill covers requirements and lifecycle.

## Meet the requirements

1. Cloudflare deployments need Workers Paid and Containers access.
2. Docker must run for local development and for direct deployments that build an image.
3. A team platform's runtime token needs Account / Containers: Edit and Account / Cloudchamber: Edit.

Done when `getSandbox('default')` then `sandbox.run(['node', '--version'])` returns exit code 0 in `void dev`.

## Run commands and read results

`getSandbox(id, options)` resolves a sandbox without starting it; the first command, file operation or port request starts the container. Local dev, direct Cloudflare and team platforms share this API. For code that runs on both targets use `getSandbox()`; `c.env.SANDBOX` exists only locally and on native Cloudflare.

- `run([exe, ...args])` resolves with `stdout`/`stderr` as `ArrayBuffer` and the exit code. For shell syntax run `['sh', '-c', command]`.
- For a long command use `exec()` and await `process.output()` or `process.exitCode`. Waiting keeps the command active during silent stretches; an unattended background command can stop once the sandbox goes idle. A runtime limit can still reject after a successful start.
- `sandbox.files.readFile()` resolves to a streaming `Response`: read it with `.text()`, `.arrayBuffer()` or `.body`. Relative file paths need an explicit `cwd`.
- `sandbox.fetch(port, request)` reaches a server in the container. WebSocket upgrades through it work on native Cloudflare deployments only; on managed Void deployments they are unavailable. (The docs also say all targets "share the same runtime API"; the WebSocket line is the exception.)

Done when every long-running command is awaited through `output()` or `exitCode`, and no file read ignores the `Response`.

## Set options at the first start

`inactivityTimeoutMs` (default 10 minutes, at most 6 hours), `enableInternet` (default `false`), string `labels`. `enableInternet` and `labels` take effect at the next container start, not on a running one: call `sandbox.destroy()` (stops the container and loses its files and processes) when a change must apply now. Confirm nothing in the container is unsaved first.

Done when the option the code relies on was set before the first command of that container.

## Persist elsewhere

Files, processes and listening servers last only as long as the container, which stops after inactivity, a crash or a restart. Write anything to keep into the database, KV or R2 before the command ends. `getSandbox(id)` selects the same Durable Object per id within a deployment; a managed platform gives each deployment its own namespace, and a rollback reconnects to that deployment's. Deleting a project on a Void platform removes its sandboxes' Durable Objects and containers.

Done when no code path depends on a file written in an earlier request.

## Use a custom image or size

Read [images.md](images.md) when the default Node.js 26 on Debian Trixie image or the `lite` size is not enough.

## Handle usage limits

Limits reject with `SandboxLimitError` (extends `UsageLimit` from `void/limits`; `resource: 'sandbox'`, `reason` is `concurrency` or `runtime_budget`). Uncaught in a route handler or page action it becomes a structured HTTP 429. Catch `instanceof UsageLimit` (AI and sandbox) or `SandboxLimitError`, answer with `error.response({ message })`, and keep the user's input so they can retry. `running()`, stopping a process and `destroy()` still work after a limit.

Done when a thrown `SandboxLimitError` in a test returns 429 or the custom message and the input is still on screen.
