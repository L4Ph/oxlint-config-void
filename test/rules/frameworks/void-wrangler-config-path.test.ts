import rule from "../../../src/plugin/rules/frameworks/void-wrangler-config-path.ts";
import { RuleTester } from "../../rule-tester.ts";

const astro = "import cloudflare from '@astrojs/cloudflare';\n";
const analog = "import analog from '@analogjs/platform';\n";
const kit = "import adapter from '@sveltejs/adapter-cloudflare';\n";

new RuleTester().run("void-wrangler-config-path", rule, {
  valid: [
    {
      code: `${astro}export default { adapter: cloudflare({ configPath: './.void-wrangler.jsonc' }) };`,
      filename: "astro.config.mjs",
    },
    {
      code: "export default defineNuxtConfig({ nitro: { cloudflare: { dev: { configPath: './.void-wrangler.jsonc' } } } });",
      filename: "nuxt.config.ts",
    },
    {
      code: `${analog}export default { plugins: [analog({ nitro: { cloudflareDev: { configPath: './.void-wrangler.jsonc' } } })] };`,
      filename: "vite.config.ts",
    },
    // A path the file does not spell out is unknown, not wrong.
    {
      code: `${astro}export default { adapter: cloudflare({ configPath: WRANGLER }) };`,
      filename: "astro.config.mjs",
    },
    // A different call named `cloudflare`.
    {
      code: "import { cloudflare } from 'other';\nexport default { adapter: cloudflare({}) };",
      filename: "astro.config.mjs",
    },
    {
      // integrations/frameworks/astro.md, lines 33-42 (step 3, astro.config.mjs)
      code: `import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { voidPlugin } from 'void';

export default defineConfig({
  adapter: cloudflare({ configPath: './.void-wrangler.jsonc' }),
  vite: { plugins: [voidPlugin()] },
});`,
      filename: "astro.config.mjs",
    },
    {
      // integrations/frameworks/sveltekit.md, lines 29-45 (step 3, vite.config.ts)
      code: `import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { voidPlugin } from 'void';

export default {
  plugins: [
    voidPlugin(),
    sveltekit({
      adapter: adapter({
        config: './.void-wrangler.jsonc',
        platformProxy: { configPath: './.void-wrangler.jsonc' },
      }),
    }),
  ],
};`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: `${astro}export default { adapter: cloudflare({}) };`,
      filename: "astro.config.mjs",
      errors: [{ messageId: "path" }],
    },
    {
      code: "export default defineNuxtConfig({ nitro: { cloudflare: { dev: { configPath: './wrangler.jsonc' } } } });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "path" }],
    },
    {
      code: `${analog}export default { plugins: [analog({ nitro: { preset: 'cloudflare-module' } })] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "path" }],
    },
    {
      code: `${kit}export default { plugins: [sveltekit({ adapter: adapter({ config: './.void-wrangler.jsonc' }) })] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "path" }],
    },
    {
      code: `${kit}const a = adapter();`,
      filename: "svelte.config.js",
      errors: [{ messageId: "path" }, { messageId: "path" }],
    },
  ],
});
