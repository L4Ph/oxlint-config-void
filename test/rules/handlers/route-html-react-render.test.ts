import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/handlers/route-html-react-render.ts";
import { RuleTester } from "../../rule-tester.ts";

const fixture = (path: string) => fileURLToPath(new URL(`./fixtures/${path}`, import.meta.url));

new RuleTester().run("route-html-react-render", rule, {
  valid: [
    {
      code: "export const GET = defineHandler((c) => c.html(renderToString(<Page />)));",
      filename: fixture("react-app/routes/a.tsx"),
    },
    {
      code: "export const GET = defineHandler((c) => c.text('x'));",
      filename: fixture("react-app/routes/a.tsx"),
    },
    // A file the rule does not govern: a Vue app (Hono's JSX is the documented choice there).
    {
      code: "export const GET = defineHandler((c) => c.html(<p>hi</p>));",
      filename: fixture("vue-app/routes/a.tsx"),
    },
    // An app that configures hono/jsx in vite.config.ts (guide/server-routing.md:103).
    {
      code: "export const GET = defineHandler((c) => c.html(<p>hi</p>));",
      filename: fixture("hono-jsx-app/routes/a.tsx"),
    },
    {
      // guide/server-routing.md:76-80 (React: render with the server renderer first).
      code: "import { renderToStaticMarkup } from 'react-dom/server';\nimport { defineHandler } from 'void';\nexport const GET = defineHandler((c) => c.html(renderToStaticMarkup(<h1>Hello!</h1>)));",
      filename: fixture("react-app/routes/hello.tsx"),
    },
  ],
  invalid: [
    {
      code: "export const GET = defineHandler((c) => c.html(<Page />));",
      filename: fixture("react-app/routes/a.tsx"),
      errors: [{ messageId: "jsx" }],
    },
    {
      code: "export const GET = defineHandler((c) => c.html(<p>hi</p>));",
      filename: fixture("react-app/routes/a.tsx"),
      errors: [{ messageId: "jsx" }],
    },
  ],
});
