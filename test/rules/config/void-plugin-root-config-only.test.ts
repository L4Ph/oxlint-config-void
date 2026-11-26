import rule from "../../../src/plugin/rules/config/void-plugin-root-config-only.ts";
import { RuleTester } from "../../rule-tester.ts";

const voidPlugin = "import { voidPlugin } from 'void';\n";

new RuleTester().run("void-plugin-root-config-only", rule, {
  valid: [
    {
      code: `${voidPlugin}export default { plugins: [voidPlugin()] };`,
      filename: "vite.config.ts",
    },
    {
      code: `${voidPlugin}export default { vite: { plugins: [voidPlugin()] } };`,
      filename: "nuxt.config.ts",
    },
    // A generator's config that does not call voidPlugin().
    { code: "export default {};", filename: ".vitepress/config.ts" },
    // A nested config that does not call voidPlugin().
    {
      code: "export default { plugins: [] };",
      filename: "docs/vite.config.ts",
    },
    // A test file that names voidPlugin().
    {
      code: `${voidPlugin}voidPlugin();`,
      filename: "src/plugin.test.ts",
    },
    {
      // guide/app-types.md:79, the root vite.config.ts.
      code: `// vite.config.ts
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin()],
  publicDir: '.vitepress/dist',
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: `${voidPlugin}export default { vite: { plugins: [voidPlugin()] } };`,
      filename: ".vitepress/config.ts",
      errors: [{ messageId: "root" }],
    },
    {
      code: `${voidPlugin}export default { plugins: [voidPlugin()] };`,
      filename: "docs/vite.config.ts",
      errors: [{ messageId: "root" }],
    },
  ],
});
