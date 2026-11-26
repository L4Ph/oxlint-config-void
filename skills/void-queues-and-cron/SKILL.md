---
name: void-queues-and-cron
description: Writes Void queue consumers and cron jobs and designs their failure handling. Use when adding a background job or a schedule, when messages disappear after retries, when a queue name conflicts at deploy, when a consumer needs concurrency limits, or when testing a consumer or job locally.
---

# Queues and cron

Consumers live in `queues/`, jobs in `crons/`. `void gen queue <name>` and `void gen cron <name>` create the files (placeholders for options and the cron expression). Lint holds file shapes; this skill holds failure design. Files and directories starting with `_` are ignored in both.

## 1. Name the queue

The file path is the name: `queues/emails.ts` is `emails`; `queues/order/notifications.ts` is `order-notifications`, and so would be `queues/order-notifications.ts`. Names must be unique, 1-63 characters, letters, digits and `-`, starting and ending with a letter or digit. One consumer per queue.

On `void deploy --platform cloudflare` the Cloudflare name is `<worker-name>-<queue>` (underscores in the Worker name become hyphens), so the 63-character limit and the account-wide uniqueness apply to that full name. Void reports naming and consumer conflicts at deploy. Your code still calls `queues.<name>.send()` in every environment. Moving an existing deployment to this naming: `cloudflare-names.md`.

Done when no two files map to one name and the full name fits 63 characters.

## 2. Write the consumer

`export default defineQueue<Message>(async (batch, env) => { ... })`; `Message` types both the handler and `queues.<name>.send()` from `void/queues`.

- Decide per message: `msg.ack()`, `msg.retry({ delaySeconds })`, or `batch.ackAll()` / `batch.retryAll()`. The first call per message wins. A message with no decision is acknowledged when the handler returns and retried when it throws; Void logs the error.
- Done when every message path ends in an explicit `ack()` or `retry()`, or you chose the default knowingly.

## 3. Set delivery options

Export whole-number constants from the queue file: `maxBatchSize` (default 10), `maxBatchTimeout` seconds (5), `maxConcurrency` 1 to 250 (Cloudflare autoscaling when omitted), `maxRetries` (3), `retryDelay` seconds (0). Write each literally (`export const maxRetries = 5`); computed values and re-exports are not supported, so repeat shared settings in every queue file.

Set `maxConcurrency` when the consumer calls a rate-limited API or a service that needs bounded parallel work: `maxBatchSize` bounds messages per batch, `maxConcurrency` bounds batches running at once. On Void-managed deployments it needs platform version 1.10.0 or later; direct Cloudflare takes it as well.

## 4. Plan for lost messages

Void-managed queues configure no dead-letter queue. A message that exhausts `maxRetries` is permanently deleted by Cloudflare. The docs say this for Void-managed queues; they say nothing on direct Cloudflare, so verify the queue's dead-letter setting in Cloudflare before relying on one.

Design so a deleted message is survivable: make the handler idempotent, record the work (a row, a status) before relying on the message, and let a cron job re-enqueue or alert on unfinished work. Done when you can say what happens to the work when the last retry fails.

## 5. Write the cron job

`crons/<name>.ts` exports `cron` (one expression or an array, each expression one schedule) and a default handler, normally `defineScheduled(async (controller, env) => { ... })`. Jobs sharing an expression each run once per invocation; Void waits for all and reports failures.

Limits on a Void platform: 100 distinct cron expressions and 1,000 schedules per project (jobs sharing an expression count once toward the 100). On your own Cloudflare account, Cloudflare's Cron Trigger limits apply instead. Done when the count of distinct expressions is under 100.

## 6. Test locally

Schedules do not fire in local development, and the local queue path differs by app type. Every dev call needs the `x-void-dev-trigger` token that the dev server prints (with a paste-ready curl command) at start.

| Case | How |
| --- | --- |
| Queue, native Void app | send through the binding; Miniflare invokes the consumer. `POST /__void/queue` also works |
| Queue, supported meta-framework | sending does not invoke the consumer; `POST /__void/queue` with `{ "queue", "messages": [{ "id", "timestamp", "body", "attempts" }] }` |
| Cron job | `POST /__void/scheduled` with `{ "cron": "<an expression the job exports>", "scheduledTime": <unix ms> }`; success returns `{ "ok": true }` |

Deployed framework apps: `/__void/scheduled` needs a matching `x-void-internal` token (the platform proxy supplies its own; `CRON_SECRET` is for manual calls). A missing or wrong token returns 401 and runs nothing. Native scheduled events need no token.

Done when the consumer or job ran once under the local call and its effect is visible.
