# Static assets

Read when choosing a cache policy for files, deciding whether the Worker runs before an asset, or deploying a framework app directly to Cloudflare.

## Cache policy for files

- Hashed build files in `build.assetsDir` (default `assets/`) are immutable for one year. Files copied from `public/` and custom build outputs with stable file names keep normal revalidation, even inside the assets directory. Do not expect immutable caching for them; choose a policy with `routing.headers` (see `void-routing-rules`), and use immutable only for URLs that change with their content.
- Other static files (`index.html`, `favicon.ico`) are cached until the next deploy and revalidated on each request. No manual purge is needed.
- API routes (`/api/*`), SSR pages, non-GET requests, requests with `Cookie`, `Authorization` or `Cf-Access-Jwt-Assertion`, and anything other than a complete `200` are not cached as assets.
- To cache public rendered pages use revalidation, not asset caching: `void-isr-and-prerendering`.

## Run the Worker before an asset

Set `cloudflare.assets.run_worker_first` in `void.config.ts` only when server code must run before an asset is served. `true` runs the Worker on every request and counts toward Worker request usage.

## Framework apps on direct Cloudflare

For TanStack Start, React Router or vinext on the direct target, configure the asset binding, directory and routing policy in the framework's own Cloudflare config, not in `void.config.ts`.

Done when the response headers of a sample asset (`curl -I`) show the `Cache-Control` you chose.
