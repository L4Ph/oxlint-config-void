# Static site generator with API routes

Read when a VitePress, Docusaurus or other generator project also has backend files and Void stops for an app type.

Choose one:

- Deploy both: set `inference.appType: 'void'` and build the generator before the Void app.

```ts
export default defineConfig({
  inference: { appType: "void", build: "vitepress build && vite build" },
});
```

```ts
// root vite.config.ts
export default defineConfig({
  plugins: [voidPlugin()],
  publicDir: ".vitepress/dist", // the generator output becomes the static assets
});
```

`vitepress build` emits the site; `vite build` copies `publicDir` into `dist/client` and emits the Worker into `dist/ssr`. Keep `voidPlugin()` in the root `vite.config.ts` only, never in the generator's own config (for example `.vitepress/config.ts`). The Worker answers requests no asset matched; set `routing.notFound: '404-page'` to serve the generator's `404.html` for them.

- Deploy the static output only: `inference: { appType: 'static', outputDir: '.vitepress/dist' }`.

Done when a build finishes and `dist/client` contains the generated pages (for the first option) or `void deploy` uploads only `outputDir` (for the second).
