import rule from "../../../src/plugin/rules/convention-files/render-includes-asset-tags.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineRender } from 'void';\n";

new RuleTester().run("render-includes-asset-tags", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineRender(async (c, tags) => c.html(tags.css + tags.preloads + tags.body));`,
      filename: "src/main.ssr.tsx",
    },
    {
      code: `${IMPORT}export default defineRender(async (c, { css, preloads, body }) => c.html(css + preloads + body));`,
      filename: "src/main.ssr.tsx",
    },
    {
      code: `${IMPORT}export default defineRender(async (c) => c.html(''));`,
      filename: "src/other.tsx",
    },
    {
      code: `${IMPORT}export default defineRender(async (c, tags) => render(tags));`,
      filename: "src/main.ssr.tsx",
    },
    // guide/ssr.md line 40 (Render API)
    {
      code: `import { renderToString } from 'react-dom/server';\nimport { defineRender } from 'void';\nimport App from './App';\n\nexport default defineRender(async (c, assetTags) => {\n  const url = new URL(c.req.raw.url);\n  const html = renderToString(<App url={url.pathname} />);\n  return new Response(\n    \`<!doctype html>\n<html>\n  <head>\${assetTags.css}\${assetTags.preloads}</head>\n  <body>\n    <div id="root">\${html}</div>\n    \${assetTags.body}\n  </body>\n</html>\`,\n    { headers: { 'content-type': 'text/html; charset=utf-8' } },\n  );\n});`,
      filename: "src/main.ssr.tsx",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineRender(async (c) => c.html('<html></html>'));`,
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${IMPORT}export default defineRender(async (c, assetTags) => c.html(\`<head>\${assetTags.css}</head>\`));`,
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export const render = async (c, tags) => c.html(tags.css + tags.body);",
      filename: "src/main.ssr.ts",
      errors: [{ messageId: "missing" }],
    },
  ],
});
