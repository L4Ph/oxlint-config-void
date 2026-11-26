import rule from "../../../src/plugin/rules/config/void-plugin-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const voidPlugin = "import { voidPlugin } from 'void';\n";

new RuleTester().run("void-plugin-options", rule, {
  valid: [
    { code: `${voidPlugin}voidPlugin({ persistTo: '.state' });`, filename: "vite.config.ts" },
    {
      code: `${voidPlugin}voidPlugin({ auxiliaryWorkers: [{ configPath: './worker.jsonc' }] });`,
      filename: "vite.config.ts",
    },
    {
      code: `${voidPlugin}voidPlugin({ auxiliaryWorkers: [{ config: {}, viteEnvironment: { name: 'a' }, devOnly: true }] });`,
      filename: "vite.config.ts",
    },
    // A function of another package with the same name is not Void's.
    {
      code: "import { voidPlugin } from './mine';\nvoidPlugin({ routing: {} });",
      filename: "vite.config.ts",
    },
    // Not a file that calls voidPlugin().
    { code: "export const options = { routing: { typedRoutes: true } };", filename: "src/a.ts" },
    {
      // reference/api/plugin.md:13, the plain call.
      code: `import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin()],
});`,
      filename: "vite.config.ts",
    },
    {
      // guide/database/d1.md:14, persistTo.
      code: `${voidPlugin}export default { plugins: [voidPlugin({ persistTo: 'local-state' })] };`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: `${voidPlugin}voidPlugin({ routing: { typedRoutes: true } });`,
      filename: "vite.config.ts",
      errors: [{ messageId: "option" }],
    },
    {
      code: `${voidPlugin}voidPlugin({ auxiliaryWorkers: [{ main: './w.ts' }] });`,
      filename: "vite.config.ts",
      errors: [{ messageId: "worker" }],
    },
  ],
});
