---
name: void-realtime-sse-and-live
description: Chooses between Void SSE, Live and WebSockets, then builds the server-to-browser stream - eventStream, connectEventStream, defineLiveStream, publish, topics, owner checks, limits, replay. Use when streaming server events, broadcasting to subscribers, or when clients miss events or get 403 on a live stream.
---

Lint (`realtime` and `server-client-boundary` families) checks imports, the connect/control route pair, subscription ids and limits options; this skill covers the choice and the delivery model.

## Choose the transport

| Need | Use |
| --- | --- |
| One request produces the whole stream (AI tokens, progress, logs) | `void/sse` |
| Other requests, jobs or queues publish to connected browsers; several topics over one connection | `void/live` |
| Two-way messages | WebSockets (`void-websockets` skill) |

Done when the transport is named with the row that justified it.

## Stream with SSE

1. Authenticate like a JSON route: `await requireAuth(c)` before `eventStream(...)`.
2. Return `eventStream(async (stream) => { ... }, { signal: c.req.raw.signal })` from a `GET` handler in `routes/`. The stream closes when the callback returns: wait on `stream.closed`, a producer promise or a cancellation signal.
3. Writing to a closed stream throws `SseStreamClosedError`. In timers and callbacks catch it: `stream.send(...).catch(() => stream.close())`.
4. For replay, give each event an `id` and read `getLastEventId(c.req.raw)` from `void/sse` on reconnect. Browsers send `Last-Event-ID` only after an event that had an `id`. Void stores nothing; resume from your own storage.
5. Browser: `connectEventStream(url, { withCredentials: true })` from `void/sse/client` (browser-only). It wraps `EventSource`: no request body, no custom headers. Use cookie auth, signed URLs or a fetch-based streaming route when headers are needed. Payloads parse as JSON; pass `parse: 'text'` or a parser otherwise.
6. With `routing.typedRoutes` the URL is type-checked; cast a runtime-validated URL with `as RouteUrl` from `void/routes`.

Done when a second tab opened mid-stream gets the events from its `Last-Event-ID` onward (if replay is required) and killing the request ends the callback.

## Publish with Live

1. Define the stream in a server-only module inside a scanned directory (`src/`); Void enables live when a scanned file imports `void/live`. For another directory add it to `inference.scanDirs` together with the default directories you still use, because `scanDirs` replaces them.
2. Expose it as a pair on one route: `GET` -> `live.connect(c)`, `POST` -> `live.control(c)`. For authenticated streams pass the same `owner` to both, or set `identifyConnection` once in `defineLiveStream`.
3. Without an owner (no `identifyConnection` result and no signed-in user) and without `allowAnonymousControl`, Void answers 403.
4. The owner check says who may change subscriptions, not which topics may be read. Without `onSubscribe` any owner reads every topic, and topic names are guessable. Add `onSubscribe` that returns a `Response` (403) to refuse a topic. Read [live-reference.md](live-reference.md) for an example.
5. Publish from routes, jobs or queues: `await live.publish('post:12', json, { type, eventId })`. Void passes `type` and `eventId` through without interpreting them. Outside a request or runtime context use `live.withEnv(env).publish(...)`.
6. Browser: `connectLiveStream('/live', { withCredentials: true })` from `void/live/client`, then `stream.subscribe({ id, topic, onEvent })`. A second subscription with the same `id` on a connection replaces the first.

Done when a published event reaches a subscriber and a subscriber the `onSubscribe` refuses gets no event.

## Fit the limits

Defaults per stream: 256 subscriptions per connection, 256 per topic (a user with two tabs counts twice), 100 operations per control request, 100 queued events per connection, 64 KiB per event envelope. `maxSubscriptionsPerTopic` can be lowered, never raised above 256.

Name topics per entity (`post:${id}`) so each entity has its own 256. Beyond that, split subscribers across topics or use a dedicated realtime system.

Done when the largest expected audience of one topic is under 256 or split.

## Plan for lost events

Live delivers in order within a topic, at most once. Deploys, rollbacks, restarts and reconnects can drop state, so clients miss events. The browser helper restores subscriptions after a reconnect and sends the latest `eventId` as `lastEventId`; raw HTTP clients must resubscribe themselves. Store events in the application and resume with `eventId`/`lastEventId`. Treat live events as a hint to refetch, never as the only copy of the data.

Done when a client that was offline during a publish converges to the right state after reconnecting.
