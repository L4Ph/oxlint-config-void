---
name: void-durable-state
description: Adds and evolves Void Durable State and Durable Objects without losing stored data. Use when adding a persistent state object, when changing the shape of persisted state, when renaming or moving a definition file, or when a deploy changes Durable Object classes.
---

# Durable State and Durable Objects

A definition in `durable-objects/` is a SQLite-backed Cloudflare Durable Object. Data is keyed by two names: the resource name (the definition's `name`, inferred from its file path) and the instance name (what you pass to `.get()`). Change either and you read different, empty storage. Lint holds the `define*` call shapes; this skill holds renames and deploys. Native Void apps on Void platforms and direct Cloudflare only: not meta-frameworks, Node.js, Bun or Deno.

## 1. Define and call it

- `defineDurableState({ initialState, methods })`, default-exported from `durable-objects/<file>.ts`. `fetch`, `alarm` and `constructor` are reserved method names; pass `fetch` and `alarm` as top-level hooks.
- Select an object with `Definition.get(name)`; the same name always resolves to the same object. `getById(id)` takes a `DurableObjectId`.
- Mutate `context.state`. Void saves it after a method succeeds and restores the previous value when the handler or the save fails. Writes to `context.storage` are not part of that rollback, so keep data in `state` when it must roll back.
- Done when two calls with one name see one `count`, and a method that throws leaves `state` as before.

## 2. Change the shape of persisted state

Bump `version` and add a migration: versions start at `1`, are contiguous, and run in order before a method sees the state. Each `migrate(old)` returns the next shape. Done when an object stored under the old shape loads and a method reads the new fields.

State migrations rewrite saved values. They are not the Cloudflare class migrations in `void.lock.json` (section 4).

## 3. Rename or move a definition file

The inferred name comes from the path, so moving the file renames the resource and orphans its data. Pin the name first.

1. Run `void info` (local, read-only). It prints each definition's file, name, class and binding, for example `name: "counter"`.
2. Add that `name` to the existing `defineDurableState` (a static string, inline or in a local `const`, words starting with a letter such as `'shopping-cart'`).
3. Move or rename the file within `durable-objects/`, fix the imports, deploy.
4. Keep `name` and every name passed to `.get()` unchanged. Names must give distinct Worker classes and bindings.

File already moved? `void info` also lists resources recorded in `void.lock.json` with no matching definition. Identify the original, use its suggested name, or restore the original file from history and run `void info` before moving again. Keep the lock and migration history.

For `defineDurableObject` classes, keep the resource name and instance names stable across deployments.

Done when `void info` shows the same name for the moved file as before the move.

## 4. Deploy class changes

Read `class-migrations.md` before deploying a class addition, rename or removal, or when `void.lock.json` changes. Always: commit `void.lock.json` when Void adds a resource, and never delete or reorder its deployed migration entries.

## 5. Mind the limits

- At most 32 distinct custom classes per project on a Void platform, counting removed classes whose storage is retained.
- Rollback on a Void platform restores class code and keeps current stored data; removing a definition makes the class inactive, and re-adding the same resource name restores its data. Deleting the project deletes the storage.
- Upgrade an older Void installation before deploying custom Durable Objects.
