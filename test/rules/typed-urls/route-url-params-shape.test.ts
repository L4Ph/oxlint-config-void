import rule from "../../../src/plugin/rules/typed-urls/route-url-params-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { routeUrl } from 'void/routes';\n`;

new RuleTester().run("route-url-params-shape", rule, {
  valid: [
    { code: `${head}routeUrl('/users/[id]', { params: { id } });`, filename: "pages/x.tsx" },
    {
      code: `${head}routeUrl('/files/[...path]', { params: { path: 'a/b' } });`,
      filename: "pages/x.tsx",
    },
    { code: `${head}routeUrl('/files/[...path]', { params: { path } });`, filename: "pages/x.tsx" },
    {
      // Not Void's routeUrl.
      code: `function routeUrl(a, b) {}\nrouteUrl('/users/[id]', { params: { id: encodeURIComponent(id) } });`,
      filename: "pages/x.tsx",
    },
    {
      // guide/type-safety.md:136-142 and 171-181 (routeUrl, catch-all)
      code: `${head}const url = routeUrl('/users/[id]', {
  params: { id: 42 },
  query: { tab: 'activity' },
  hash: 'details',
});
routeUrl('/files/[...path]', { params: { path: 'docs/get started' } });
routeUrl('/files/[...]', { params: { '*': 'docs/get started' } });`,
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}routeUrl('/users/[id]', { params: { id: encodeURIComponent(id) } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "encoded" }],
    },
    {
      code: `${head}routeUrl('/files/[...path]', { params: { path: ['a', 'b'] } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "catchAll" }],
    },
    {
      code: `${head}routeUrl('/files/[...path]', { params: { path: p.split('/') } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "catchAll" }],
    },
  ],
});
