import rule from "../../../src/plugin/rules/config/no-duplicate-framework-plugin.ts";
import { RuleTester } from "../../rule-tester.ts";

const voidReact = "import { voidReact } from '@void/react/plugin';\n";
const voidVue = "import { voidVue } from '@void/vue/plugin';\n";

new RuleTester().run("no-duplicate-framework-plugin", rule, {
  valid: [
    {
      code: `${voidReact}export default { plugins: [voidPlugin(), voidReact({ react: { babel: {} } })] };`,
      filename: "vite.config.ts",
    },
    {
      code: `${voidVue}export default { plugins: [voidPlugin(), voidVue({ vue: {} })] };`,
      filename: "vite.config.ts",
    },
    // The framework plugin alone, with no Void adapter.
    {
      code: "import react from '@vitejs/plugin-react';\nexport default { plugins: [react()] };",
      filename: "vite.config.ts",
    },
    // Not a Vite config file.
    {
      code: `${voidReact}import react from '@vitejs/plugin-react';\nexport default { plugins: [voidReact(), react()] };`,
      filename: "src/plugins.ts",
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
    },
  ],
  invalid: [
    {
      code: `${voidReact}import react from '@vitejs/plugin-react';\nexport default { plugins: [voidPlugin(), voidReact(), react()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "duplicate" }],
    },
    {
      code: `${voidVue}import vue from '@vitejs/plugin-vue';\nexport default { plugins: [voidPlugin(), voidVue(), vue()] };`,
      filename: "vite.config.ts",
      errors: [{ messageId: "duplicate" }],
    },
    {
      code: "import { voidSolid } from '@void/solid/plugin';\nimport solid from 'vite-plugin-solid';\nexport default { plugins: [voidSolid(), solid()] };",
      filename: "vite.config.mts",
      errors: [{ messageId: "duplicate" }],
    },
  ],
});
