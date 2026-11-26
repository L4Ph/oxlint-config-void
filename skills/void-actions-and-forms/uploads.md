# File uploads

Read when a form sends a `File`, `Blob` or `FileList`. Setting one in form data makes `useForm` submit `multipart/form-data`.

## Read the upload

In the action, call `c.req.parseBody()` (not `c.req.json()`) and take the field: `const file = body['photo']`. Check `file instanceof File && file.size > 0` before use. `withValidator({ body })` also accepts uploads.

## Coerce multipart values

Nested names such as `profile[name]`, `tags[0]` and `tags[]` become objects and arrays. Every other value arrives as a string, so coerce in the schema: booleans as `'1'` or `'0'`, numbers and dates as strings, `null` as `''`.

## Choose the storage key and file types

`file.name` and `file.type` come from the browser. Build the key on the server (`uploads/${crypto.randomUUID()}.${ext}`) and take the extension from an allow-list keyed by `file.type` (jpeg, png, webp). Reject anything else with `ValidationError({ photo: 'Upload a JPEG, PNG, or WebP image.' })`. Store with `storage.put(key, file.stream(), { httpMetadata: { contentType } })` from `void/storage`; The Void docs page `guide/storage.md` (section Serving Files) covers sending files back safely.

Done when an upload of an unlisted type returns the field error and a valid one lands under a generated key.
