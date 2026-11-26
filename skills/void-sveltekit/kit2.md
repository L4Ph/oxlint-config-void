# SvelteKit 2.62+ differences

Read this when `@sveltejs/kit` is 2.x. Docs: `integrations/frameworks/sveltekit.md`, "Existing SvelteKit 2 apps".

1. Use `@sveltejs/adapter-cloudflare` 7. The Vite config of the main skill works unchanged.
2. Add Void's tsconfig hook to the `sveltekit()` options:

```ts
import { withVoidTSConfig } from 'void/sveltekit';

sveltekit({
  adapter: adapter({ /* same options as Kit 3 */ }),
  typescript: { config: withVoidTSConfig() },
});
```

   If the app has `svelte.config.js` or `svelte.config.ts`, keep it and put `typescript.config: withVoidTSConfig()` under `kit`.
3. Keep the Kit 2 tsconfig instead of the Kit 3 one:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": { "types": ["void/env"] }
}
```

4. Raw bindings: `platform.env` stays available in hooks and load functions.

Done when `typescript.config: withVoidTSConfig()` is set once (Vite options or `kit`), tsconfig extends `./.svelte-kit/tsconfig.json`, and typecheck exits 0 after `void prepare`. Lint: `sveltekit-void-tsconfig`.
