---
name: void-kv-and-storage
description: Uses Void KV and R2 object storage correctly. Use when reading or paginating `kv` values, when a stored value comes back as a string instead of an object, when adding a second R2 bucket, when KV needs an operation the client lacks, or when `storage.locationHint` seems to do nothing.
---

# KV and object storage

`kv` from `void/kv` and `storage` from `void/storage` are the app-facing clients. Lint holds import shapes and the safe serving headers for stored files (rule `served-upload-nosniff`); this skill holds the data-shape caveats.

## KV values

1. Values are JSON on the way in, strings included: `kv.put('k', '123')` reads back as the string `"123"`, and `"null"` reads back as a string.
2. `kv.get<T>` parses JSON. When the stored value is not valid JSON (written by another tool or the raw binding), it returns the raw string, so the type `T` can be wrong at run time. Check `typeof` before trusting `T` on data that did not come from `kv.put`.
3. `kv.list({ prefix, limit, cursor })` returns a page. Loop: pass `cursor` from the previous page and stop when `list_complete` is true.
4. `kv.map<T>('name')` gives a typed client that prefixes keys with `name:` and strips the prefix when listing; it has the same methods (`get`, `put`, `delete`, `list`, `getWithMetadata`).
5. An operation the client lacks: use the raw `KVNamespace` as `c.env.KV` inside a route handler.
6. Done when every `kv.get` of data with an uncertain origin handles a string, and every list loop ends on `list_complete`.

## A second R2 bucket

1. Declare it in `void.config.ts` under `cloudflare.r2_buckets`, for example `{ binding: 'MY_BUCKET', bucket_name: 'uploads' }`.
2. Run `void prepare` so the binding is typed.
3. Wrap it: `createStorage(c.env.MY_BUCKET)` from `void/storage`; the result has the same methods as `storage`.
4. Done when `c.env.MY_BUCKET` type-checks and a `put` then `get` through the wrapped client round-trips.

## `storage.locationHint`

The hint (`apac`, `eeur`, `enam`, `weur`, `wnam`, `oc`) applies only when Void creates a bucket, and Cloudflare treats it as best effort, not data residency. Changing it later never moves or replaces an existing bucket. To get a bucket elsewhere, create a new bucket (a second binding above) and move objects yourself. Done when you have stated which bucket a changed hint will, and will not, affect.
