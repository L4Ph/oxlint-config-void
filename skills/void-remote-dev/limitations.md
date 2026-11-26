# Remote mode limitations

Read before using these calls in a remote session. Each is a difference from local Miniflare.

## R2

- Multipart uploads: `createMultipartUpload()` and `resumeMultipartUpload()` are unsupported. Upload with `put()` or run that code locally.
- Range and conditional reads: `get()` ignores request headers passed as `range` or `onlyIf` and returns the whole object (for example `get(key, { range: request.headers, onlyIf: request.headers })` with a `Range` or `If-None-Match` header). `get()` throws when `range` or `onlyIf` is an object asking for a byte range or a condition (`{ offset: 0, length: 100 }`, `{ etagMatches: etag }`).
- Conditional writes: `put(..., { onlyIf })` needs an updated platform and project deployment; a failed precondition returns `null`.
- Metadata and list options: custom metadata, HTTP metadata, and `list()` with `delimiter`, `startAfter` or `include` need an updated project deployment. Without one, those `list()` calls and `put()` with metadata other than `contentType` throw.

## D1

- `db.dump()` is unsupported.
- `db.batch()` needs an updated platform and project deployment.

Done when the code path under test avoids the unsupported calls, or the project has been redeployed with a current Void and the call succeeds.
