import rule from "../../../src/plugin/rules/frameworks/no-cloudflare-vite-plugin-with-void.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-cloudflare-vite-plugin-with-void", rule, {
  valid: [
    {
      code: "import { voidPlugin } from 'void';\nimport { reactRouter } from '@react-router/dev/vite';\nexport default { plugins: [voidPlugin(), reactRouter()] };",
      filename: "vite.config.ts",
    },
    {
      code: "import { voidPlugin } from 'void';\nimport { tanstackStart } from '@tanstack/react-start/plugin';\nexport default { plugins: [voidPlugin(), tanstackStart()] };",
      filename: "vite.config.ts",
    },
    // Without voidPlugin() the Cloudflare plugin is the app's own choice.
    {
      code: "import { cloudflare } from '@cloudflare/vite-plugin';\nexport default { plugins: [cloudflare()] };",
      filename: "vite.config.ts",
    },
    // Not a Vite config.
    {
      code: "import { cloudflare } from '@cloudflare/vite-plugin';\nimport { voidPlugin } from 'void';\nexport default { plugins: [voidPlugin(), cloudflare()] };",
      filename: "src/other.ts",
    },
    {
      // integrations/frameworks/react-router.md, lines 28-37 (step 3, vite.config.ts)
      code: `import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [
    voidPlugin(), // must come before the framework plugin
    reactRouter(),
  ],
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: "import { cloudflare } from '@cloudflare/vite-plugin';\nimport { voidPlugin } from 'void';\nimport { reactRouter } from '@react-router/dev/vite';\nexport default { plugins: [voidPlugin(), cloudflare(), reactRouter()] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "adapter" }],
    },
    {
      code: "import { cloudflare } from '@cloudflare/vite-plugin';\nimport { voidPlugin } from 'void';\nimport { tanstackStart } from '@tanstack/react-start/plugin';\nexport default { plugins: [cloudflare(), voidPlugin(), tanstackStart()] };",
      filename: "vite.config.mts",
      errors: [{ messageId: "adapter" }],
    },
  ],
});
