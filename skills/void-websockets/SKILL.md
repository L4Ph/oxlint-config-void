---
name: void-websockets
description: Writes Void WebSocket routes (.ws.ts) - defineRoom, defineWebSocket, connect, getRoom actions, connection identity, and moving or renaming a deployed route without losing its Durable Object state. Use when adding realtime rooms, closing sockets on ban or logout, or before moving, renaming or re-parameterising a deployed .ws route.
---

Lint (`realtime` family) checks file shapes, definition options and room-action signatures; this skill covers identity, server-side calls and move safety.

## Check the target

WebSocket routes need the Cloudflare target, and typed `.ws.ts` routes work only in native Void apps, not in meta-framework mode. They run on direct Cloudflare and on Void platform deployments. Each route instance has its own Durable Object. Commit `void.lock.json` when Void adds a binding or migration; never delete or reorder deployed migration steps.

Done when the app is a native Void app deployed to Cloudflare or a Void platform.

## Pick the definition

- `defineRoom()` (from `void/ws`): clients share a room or document that the route identifies (`routes/chat/[room].ws.ts`). Hooks get `ctx.room` and `ctx.connection`.
- `defineWebSocket()`: each connection is handled alone (`routes/notifications.ws.ts`). Hooks get `ctx.socket`.

Both take `messages: { client, server }` schemas (JSON events only; no raw strings or binary), and hooks `onBeforeConnect`, `onConnect`, `onMessage`, `onClose`, `onRequest`.

Done when the route has the right definition and `onBeforeConnect` returns a 401 `Response` for anonymous clients that must not connect.

## Take identity from the server

1. `ctx.user` is resolved when the socket connects and never changes for that connection, even after sign-out or session revocation. In `onMessage`, re-check your own records for a ban or role change and close with `ctx.connection.close()` (rooms) or `ctx.socket.close()` (`defineWebSocket`).
2. A connection from another origin is anonymous unless that origin is in the auth `trustedOrigins`. If you read your own cookies from `ctx.request` in `onBeforeConnect`, check `Origin` yourself.
3. In `onMessage` and `onClose`, `ctx.request` is a placeholder without headers, cookies or query. Save what you need in `onConnect` with `ctx.connection.setState()` (rooms) or `ctx.socket.setState()` and read it back from `.state`.
4. Derive any id that later code matches on (session id, account) from `getSession()` or your own records, never from the URL, query string or a client message.

Done when no `onMessage` decision relies on `ctx.user` alone and no stored id came from client input.

## Reach a room from other server code

Declare `actions` on the room, call them with `getRoom(pattern, { params })` from `void/ws/server` in routes, auth hooks, queue consumers or cron. The room is the same instance `connect()` reaches; `getRoom` takes the route pattern and the same params (a custom `key` is applied too).

- Annotate every action parameter (an unannotated one is `never`) and pass structured-clone data: no callbacks or class instances.
- Actions get `ctx.id`, `ctx.params`, `ctx.env`, `ctx.storage`, `ctx.room`; no `ctx.request` or `ctx.user`. Authorize where you call.
- `getRoom()` throws for an unknown route, a `defineWebSocket` route or a missing param; an unknown action or a handler error rejects the call.
- Inside the room's own hooks use `ctx.room`, never `getRoom()` (the call would wait on the room itself).
- Outside a Void-run handler pass the bindings: `getRoom(pattern, { params, env })`.
- To close idle sockets when a session is revoked, store the session id in `onConnect` from `getSession()`, then call an action from the revocation code with that same id.

Actions are not an endpoint: a browser request or socket message cannot call one.

Done when the revocation path was exercised and the sockets of that session closed.

## Move or rename a deployed route

Run this before moving the file, changing a param name or value, or renaming a `name`. A wrong move makes Void select a different Durable Object: the old room's storage is orphaned and rooms start empty.

1. Run `void info`. Add the `name` it prints to `defineRoom`/`defineWebSocket` (a static string, inline or a local `const`). Each route must produce a distinct Worker class; changing `name` later selects a different resource.
2. If you already moved a route, `void info` also lists unmatched identities from `void.lock.json`. Find the original resource before adopting a suggested name; otherwise restore the original source and read the name there.
3. Move the file, update clients to the new path, keep parameter names and values the same, deploy.
4. Renaming a parameter (`[room]` -> `[id]`): the default key contains parameter names (`room=general`). Preserve it: ``key: ({ params }) => `room=${params.id}` ``. Returning only `params.id` selects a different instance. For several parameters keep the complete old key (`team=acme&room=general`; a value containing `&` switches to a versioned encoding). `key` must return a string synchronously and stay stable after deployment.

Done when the new `void info` output shows the name matched and `general` in the new location still has its old storage.

## One socket, one route

A socket connects to one route instance. To switch rooms, close it and connect again. To publish across topics use `void-realtime-sse-and-live`.
