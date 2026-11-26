import rule from "../../../src/plugin/rules/config/void-plugin-in-vite-config.ts";
import { RuleTester } from "../../rule-tester.ts";

const voidPlugin = "import { voidPlugin } from 'void';\n";

new RuleTester().run("void-plugin-in-vite-config", rule, {
  valid: [
    {
      code: `${voidPlugin}export default defineConfig({ plugins: [voidPlugin(), voidReact()] });`,
      filename: "vite.config.ts",
    },
    {
      code: "export default defineConfig({ plugins: [...base] });",
      filename: "vite.config.ts",
    },
    // A plugins array may hold voidPlugin() through a helper this file does not show.
    {
      code: "import { appPlugins } from './plugins';\nexport default defineConfig({ plugins: [appPlugins()] });",
      filename: "vite.config.ts",
    },
    // A nested config belongs to another tool.
    {
      code: "export default defineConfig({ plugins: [vitepressPlugin()] });",
      filename: "docs/vite.config.ts",
    },
    // Not a config file the rule governs.
    { code: "export default { plugins: [] };", filename: "src/plugins.ts" },
    {
      // guide/app-types.md:79, the root vite.config.ts of a static site with a backend.
      code: `// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin()],
  // The SSG's output becomes the static assets of the Void build.
  publicDir: '.vitepress/dist',
});`,
      filename: "vite.config.ts",
    },
    {
      // integrations/frameworks/nuxt.md:42, voidPlugin() under vite.plugins.
      code: `import { resolve } from 'node:path';
import { voidPlugin } from 'void';

export default defineNuxtConfig({
  nitro: { preset: 'cloudflare-module', modules: ['void/nitro'] },
  vite: { plugins: [voidPlugin()] },
});`,
      filename: "nuxt.config.ts",
    },
    {
      // integrations/frameworks/astro.md:36, voidPlugin() under vite.plugins.
      code: `import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';
import { voidPlugin } from 'void';

export default defineConfig({
  adapter: cloudflare({ configPath: './.void-wrangler.jsonc' }),
  vite: { plugins: [voidPlugin()] },
});`,
      filename: "astro.config.mjs",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ plugins: [voidReact()] });",
      filename: "vite.config.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "import { voidPlugin } from '@void/plugin';\nexport default defineConfig({ plugins: [voidPlugin()] });",
      filename: "vite.config.ts",
      errors: [{ messageId: "wrongSource" }],
    },
    {
      code: "export default defineNuxtConfig({ vite: { plugins: [tailwind()] } });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default defineConfig({ vite: { plugins: [tailwind()] } });",
      filename: "astro.config.mjs",
      errors: [{ messageId: "missing" }],
    },
  ],
});
