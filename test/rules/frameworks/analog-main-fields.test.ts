import rule from "../../../src/plugin/rules/frameworks/analog-main-fields.ts";
import { RuleTester } from "../../rule-tester.ts";

const analog = "import analog from '@analogjs/platform';\n";

new RuleTester().run("analog-main-fields", rule, {
  valid: [
    {
      code: `${analog}export default { resolve: { mainFields: ['module'] }, plugins: [analog()] };`,
      filename: "vite.config.ts",
    },
    {
      code: "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };",
      filename: "vite.config.ts",
    },
    // Not a Vite config: the rule does not govern it.
    { code: `${analog}export default { plugins: [analog()] };`, filename: "src/app/main.ts" },
    // A spread may bring `resolve` in.
    {
      code: `${analog}export default { ...base, plugins: [analog()] };`,
      filename: "vite.config.ts",
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
      code: `${analog}export default { plugins: [analog()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${analog}export default { resolve: { mainFields: ['browser', 'module'] }, plugins: [analog()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "wrong" }],
    },
    {
      code: `${analog}export default { resolve: { alias: {} }, plugins: [analog()] };`,
      filename: "vite.config.mts",
      errors: [{ messageId: "missing" }],
    },
  ],
});
