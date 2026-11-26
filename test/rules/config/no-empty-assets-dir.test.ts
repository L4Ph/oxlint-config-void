import rule from "../../../src/plugin/rules/config/no-empty-assets-dir.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-empty-assets-dir", rule, {
  valid: [
    {
      code: "export default { build: { assetsDir: 'assets' } };",
      filename: "vite.config.ts",
    },
    { code: "export default {};", filename: "vite.config.ts" },
    // Not a Vite config file.
    { code: "export default { build: { assetsDir: '' } };", filename: "tsdown.config.ts" },
    {
      // guide/edge/static-assets.md:24, a customized assets directory.
      code: `// vite.config.ts
export default defineConfig({
  build: {
    assetsDir: 'static', // hashed assets go to dist/client/static/
  },
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default { build: { assetsDir: '' } };",
      filename: "vite.config.ts",
      errors: [{ messageId: "empty" }],
    },
    {
      code: 'export default defineConfig({ build: { assetsDir: "" } });',
      filename: "vite.config.js",
      errors: [{ messageId: "empty" }],
    },
  ],
});
