import rule from "../../../src/plugin/rules/markdown/void-markdown-plugin-setup.ts";
import { RuleTester } from "../../rule-tester.ts";

const MD = "import { voidMarkdown } from '@void/md/plugin';\n";
const REACT = "import { voidReact } from '@void/react/plugin';\n";
const VUE = "import { voidVue } from '@void/vue/plugin';\n";

new RuleTester().run("void-markdown-plugin-setup", rule, {
  valid: [
    {
      code: MD + REACT + "export default { plugins: [voidPlugin(), voidReact(), voidMarkdown()] };",
      filename: "vite.config.ts",
    },
    {
      code: MD + REACT + "export default { plugins: [voidReact(), voidMarkdown({ themes })] };",
      filename: "vite.config.ts",
    },
    {
      code: MD + "export default { plugins: [voidReact(), voidMarkdown()] };",
      filename: "vite.config.ts",
    },
    { code: REACT + "export default { plugins: [voidReact()] };", filename: "vite.config.ts" },
    {
      code: MD + "voidMarkdown({ themes: { light: 'github-light', dark: 'github-dark' } });",
      filename: "vite.config.ts",
    },
    {
      // Not a Vite config.
      code: MD + REACT + "export default { plugins: [voidMarkdown(), voidReact()] };",
      filename: "src/plugins.ts",
    },
    {
      // guide/pages-routing/markdown.md:69-76 (React tab)
      code: `import { voidMarkdown } from '@void/md/plugin';
import { voidReact } from '@void/react/plugin';
import { defineConfig } from 'vite';
import { voidPlugin } from 'void';

export default defineConfig({
  plugins: [voidPlugin(), voidReact(), voidMarkdown()],
});`,
      filename: "vite.config.ts",
    },
    {
      // guide/pages-routing/markdown.md:452-457
      code: `import { voidMarkdown } from '@void/md/plugin';

voidMarkdown({
  themes: { light: 'github-light', dark: 'github-dark' },
  copyLabel: 'Copy Code',
});`,
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: MD + REACT + "export default { plugins: [voidMarkdown(), voidReact()] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "order" }],
    },
    {
      code: MD + VUE + "export default { plugins: [voidPlugin(), voidMarkdown(), voidVue()] };",
      filename: "vite.config.mts",
      errors: [{ messageId: "order" }],
    },
    {
      code: MD + REACT + "export default { plugins: [voidReact()] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "unused" }],
    },
    {
      code: MD + "export default { plugins: [] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "unused" }],
    },
    {
      code: MD + "voidMarkdown({ shiki: { themes: { light: 'a', dark: 'b' } } });",
      filename: "vite.config.ts",
      errors: [{ messageId: "shiki" }],
    },
  ],
});
