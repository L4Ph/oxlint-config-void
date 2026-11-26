import rule from "../../../src/plugin/rules/frameworks/nuxt-compatibility-date.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("nuxt-compatibility-date", rule, {
  valid: [
    {
      code: "export default defineNuxtConfig({ compatibilityDate: '2025-07-15' });",
      filename: "nuxt.config.ts",
    },
    {
      code: "export default defineNuxtConfig({ compatibilityDate: '2026-02-24' });",
      filename: "nuxt.config.ts",
    },
    // The page's own config sets no date; nothing is reported for a missing one.
    { code: "export default defineNuxtConfig({});", filename: "nuxt.config.ts" },
    // A value that is not a plain date is not compared.
    {
      code: "export default defineNuxtConfig({ compatibilityDate: 'latest' });",
      filename: "nuxt.config.ts",
    },
    // Not a Nuxt config.
    { code: "export default { compatibilityDate: '2024-04-03' };", filename: "wrangler.config.ts" },
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
  },
  vite: { plugins: [voidPlugin()] },
});`,
      filename: "nuxt.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineNuxtConfig({ compatibilityDate: '2024-04-03' });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "early" }],
    },
    {
      code: "export default { compatibilityDate: '2025-07-14' };",
      filename: "nuxt.config.js",
      errors: [{ messageId: "early" }],
    },
  ],
});
