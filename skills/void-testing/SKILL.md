---
name: void-testing
description: Tests a Void app without a Worker. Use when writing or fixing tests that touch void/db, void/kv or void/storage, when a test must assert sent or received email, or when choosing between the email test harnesses for a framework.
---

# Testing a Void app

Tests run in Node.js under Vitest, with no Worker started and no local migrations applied. With Vite+ run `vp test` and import `it`, `expect`, `vi` from `vite-plus/test`; with plain Vite install `vitest` and use it for both. Vitest reads `vite.config.ts`, so `void/*` imports and `@schema` resolve with no extra setup. Lint holds the import and placement bans (`testing` rule family).

## 1. Place the test

Put it in `tests/` or beside the code it tests. Never inside a convention directory (`routes/`, `pages/`): Void would treat the file as an app route. A helper meant for tests in such a directory starts with `_`.

## 2. Replace binding modules

Code that reaches D1, KV, R2 or another binding through `void/db`, `void/kv` or `void/storage` cannot run without the binding. Replace the module with an in-memory stand-in that implements only the methods the code under test calls (for KV: `get` returning `null` for a missing key, and `put`).

1. Look first: does the project already replace these modules in a shared setup file (`test.setupFiles` in `vite.config.ts`)? If so, extend that stand-in; do not add per-file mocks beside it.
2. If not, mock the module with `vi.mock('void/kv', () => ({ kv: { ... } }))`, as the guide shows, keeping the stand-in's state inside the factory.
3. Done when the test passes with no Worker and the stand-in sees the calls (a second call returns what the first stored).

Docs tension to know: the guide tells you to `vi.mock()` binding modules, while a project may forbid per-file `vi.mock` of `void/*` and replace the modules once in shared setup. Follow the project's lint and setup file; the shared setup file is the place for the stand-in then.

Do not mock `void/email`: use the harness in section 3.

## 3. Capture email

`void/email/testing` captures sent and received mail. Pick the harness:

| Under test | Harness |
| --- | --- |
| Code that calls `sendEmail` | `createEmailTestHarness()` records every sent message in `inbox.messages` until `inbox.dispose()`; `clear()` empties the list and keeps the sink. Call `dispose()` in every test (`afterEach`) |
| An inbound handler under `email/` | `createInboundTestHarness({ routes: { 'support+[ticket]': handler, _default: defaultHandler } })`, then `await harness.deliver({ from, to, subject, text })`; read `result.handler`, `result.params`, `harness.rejects` |

For `deliver`, `to` is the full address including the project prefix on shared platform mail (`acme+support+abc-123@acme.dev`). On direct Cloudflare mail pass `slug: null` to `createInboundTestHarness` and use the plain address (`support+abc-123@mail.acme.com`). The harness matches handlers in the same order as deployed email routes.

The dev inbox is unavailable in SvelteKit, Nuxt, Analog and Astro (sends there return `BINDING_MISSING`), so `createEmailTestHarness` is the way to capture sends in those apps' tests.

Done when the assertion reads captured messages or `harness.rejects`, and the harness is disposed.
