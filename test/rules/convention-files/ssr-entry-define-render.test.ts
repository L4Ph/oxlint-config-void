import rule from "../../../src/plugin/rules/convention-files/ssr-entry-define-render.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("ssr-entry-define-render", rule, {
  valid: [
    {
      code: "import { defineRender } from 'void';\nexport default defineRender(async (c) => c.html(''));",
      filename: "src/main.ssr.tsx",
    },
    { code: "export const render = async () => new Response('');", filename: "src/main.ssr.tsx" },
    { code: "export const x = 1;", filename: "src/App.tsx" },
    // guide/ssr.md line 40 (Render API): `export default defineRender(...)`
    {
      code: `import { defineRender } from 'void';\nimport App from './App';\n\nexport default defineRender(async (c, assetTags) => {\n  return new Response('');\n});`,
      filename: "src/main.ssr.tsx",
    },
    // guide/ssr.md line 59: a named `render(c, assetTags)` also works
    {
      code: "export function render(c, assetTags) { return new Response(''); }",
      filename: "src/main.ssr.ts",
    },
  ],
  invalid: [
    {
      code: "export default async (c) => c.html('');",
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "renderer" }],
    },
    {
      code: "export const x = 1;",
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "renderer" }],
    },
  ],
});
