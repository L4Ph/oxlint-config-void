import rule from "../../../src/plugin/rules/frameworks/nuxt-schema-alias.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("nuxt-schema-alias", rule, {
  valid: [
    {
      code: "export default defineNuxtConfig({ alias: { '@schema': resolve(import.meta.dirname, 'db/schema.ts') } });",
      filename: "nuxt.config.ts",
    },
    {
      code: "export default defineNuxtConfig({ alias: { '@schema': './db/schema.ts' } });",
      filename: "nuxt.config.ts",
    },
    // A spread may carry the alias.
    { code: "export default defineNuxtConfig({ ...shared });", filename: "nuxt.config.ts" },
    { code: "export default defineNuxtConfig({});", filename: "app.config.ts" },
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
      code: "export default defineNuxtConfig({});",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "alias" }],
    },
    {
      code: "export default defineNuxtConfig({ alias: { '~db': './db' } });",
      filename: "nuxt.config.ts",
      errors: [{ messageId: "alias" }],
    },
  ],
});
