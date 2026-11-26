import rule from "../../../src/plugin/rules/frameworks/void-plugin-before-framework-plugin.ts";
import { RuleTester } from "../../rule-tester.ts";

const rr =
  "import { voidPlugin } from 'void';\nimport { reactRouter } from '@react-router/dev/vite';\n";
const ts =
  "import { voidPlugin } from 'void';\nimport { tanstackStart } from '@tanstack/react-start/plugin';\n";

new RuleTester().run("void-plugin-before-framework-plugin", rule, {
  valid: [
    {
      code: `${rr}export default { plugins: [voidPlugin(), reactRouter()] };`,
      filename: "vite.config.ts",
    },
    {
      code: `${ts}export default { plugins: [voidPlugin(), tanstackStart()] };`,
      filename: "vite.config.ts",
    },
    // Analog's page shows voidPlugin() after analog(), so the order there is not checked.
    {
      code: "import analog from '@analogjs/platform';\nimport { voidPlugin } from 'void';\nexport default { plugins: [analog(), voidPlugin()] };",
      filename: "vite.config.ts",
    },
    {
      code: `${rr}export default { plugins: [reactRouter(), voidPlugin()] };`,
      filename: "src/other.ts",
    },
    {
      // integrations/frameworks/tanstack-start.md, lines 27-40 (step 3, vite.config.ts)
      code: `import { tanstackStart } from '@tanstack/react-start/plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [
    voidPlugin(), // must come before the framework plugin
    tanstackStart(),
    react(),
  ],
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: `${rr}export default { plugins: [reactRouter(), voidPlugin()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "order" }],
    },
    {
      code: `${ts}export default { plugins: [tanstackStart(), voidPlugin()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "order" }],
    },
  ],
});
