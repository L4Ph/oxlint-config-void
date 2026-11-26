import rule from "../../../src/plugin/rules/frameworks/nitro-config.ts";
import { RuleTester } from "../../rule-tester.ts";

const analog = "import analog from '@analogjs/platform';\n";

new RuleTester().run("nitro-config", rule, {
  valid: [
    {
      code: "export default defineNuxtConfig({ nitro: { preset: 'cloudflare-module', modules: ['void/nitro'] } });",
      filename: "nuxt.config.ts",
    },
    {
      code: `${analog}export default { plugins: [analog({ ssr: true, nitro: { preset: 'cloudflare-module', modules: ['nitro-cloudflare-dev', 'void/nitro'] } })] };`,
      filename: "vite.config.ts",
    },
    // A nitro object with a spread may hold a preset this file does not show.
    {
      code: "export default defineNuxtConfig({ nitro: { ...base, modules: ['void/nitro'] } });",
      filename: "nuxt.config.ts",
    },
    // Not a config the rule governs.
    { code: "export default defineNuxtConfig({});", filename: "app.config.ts" },
    { code: "export default { plugins: [react()] };", filename: "vite.config.ts" },
    {
      // integrations/frameworks/nuxt.md, lines 29-47 (step 3, nuxt.config.ts)
      code: `import { resolve } from 'node:path';
import { voidPlugin } from 'void';

export default defineNuxtConfig({
  alias: {
    '@schema': resolve(import.meta.dirname, 'db/schema.ts'),
  },
  nitro: {
    preset: 'cloudflare-module',
    modules: ['void/nitro'],
    cloudflare: { dev: { configPath: './.void-wrangler.jsonc' } },
    // Required for Nuxt 4.6.0 on Windows.
    externals: {
      inline: [/[\\\\/]node_modules[\\\\/]nuxt[\\\\/]dist[\\\\/]/],
    },
  },
  vite: { plugins: [voidPlugin()] },
});`,
      filename: "nuxt.config.ts",
    },
    {
      // integrations/frameworks/analog.md, lines 29-50 (step 3, vite.config.ts)
      code: `import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      ssr: true,
      nitro: {
        preset: 'cloudflare-module',
        cloudflareDev: { configPath: './.void-wrangler.jsonc' },
        modules: ['nitro-cloudflare-dev', 'void/nitro'],
      },
    }),
    voidPlugin(),
  ],
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineNuxtConfig({ nitro: { preset: 'node' } });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "preset" }],
    },
    {
      code: "export default defineNuxtConfig({});",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "preset" }],
    },
    {
      code: "export default defineNuxtConfig({ nitro: { preset: 'cloudflare-module', modules: [] } });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "modules" }],
    },
    {
      code: `${analog}export default { plugins: [analog({ nitro: { preset: 'cloudflare-module', modules: ['nitro-cloudflare-dev'] } })] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "modules" }],
    },
    {
      code: `${analog}export default { plugins: [analog()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "preset" }],
    },
  ],
});
