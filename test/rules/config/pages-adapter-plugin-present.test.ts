import rule from "../../../src/plugin/rules/config/pages-adapter-plugin-present.ts";
import { RuleTester } from "../../rule-tester.ts";

const imports =
  "import { voidPlugin } from 'void';\nimport { voidReact } from '@void/react/plugin';\n";
const pages = [{ pages: true }];

new RuleTester().run("pages-adapter-plugin-present", rule, {
  valid: [
    {
      code: `${imports}export default { plugins: [voidPlugin(), voidReact()] };`,
      filename: "vite.config.ts",
      options: pages,
    },
    {
      code: "import { voidPlugin } from 'void';\nexport default { plugins: [voidPlugin()] };",
      filename: "vite.config.ts",
      options: [{ pages: false }],
    },
    // The option is off by default: Pages routing is optional.
    {
      code: "import { voidPlugin } from 'void';\nexport default { plugins: [voidPlugin()] };",
      filename: "vite.config.ts",
    },
    // Not a Vite config file.
    {
      code: "import { voidPlugin } from 'void';\nexport default { plugins: [voidPlugin()] };",
      filename: "src/plugins.ts",
      options: pages,
    },
    {
      // guide/pages-routing/overview.md:48, the React setup.
      code: `// vite.config.ts
import { voidReact } from '@void/react/plugin';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidReact()],
});`,
      filename: "vite.config.ts",
      options: pages,
    },
  ],
  invalid: [
    {
      code: "import { voidPlugin } from 'void';\nexport default { plugins: [voidPlugin()] };",
      filename: "vite.config.ts",
      options: pages,
      errors: [{ messageId: "missing" }],
    },
    {
      code: "import { voidPlugin } from 'void';\nimport { voidMarkdown } from '@void/md/plugin';\nexport default { plugins: [voidPlugin(), voidMarkdown()] };",
      filename: "vite.config.ts",
      options: pages,
      errors: [{ messageId: "missing" }],
    },
  ],
});
