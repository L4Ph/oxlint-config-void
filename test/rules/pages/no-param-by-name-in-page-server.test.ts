import rule from "../../../src/plugin/rules/pages/no-param-by-name-in-page-server.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-param-by-name-in-page-server", rule, {
  valid: [
    {
      code: "export const loader = defineHandler((c) => { const { id } = c.req.param() as PageParams<'/users/[id]'>; return { id }; });",
      filename: "pages/users/[id].server.ts",
    },
    { code: "export const loader = defineHandler(() => ({}));", filename: "pages/a.server.ts" },
    {
      // A route handler is not a page companion (guide/storage.md:47).
      code: "export const GET = defineHandler(async (c) => storage.get(`uploads/${c.req.param('key')}`));",
      filename: "routes/files/[key].ts",
    },
    {
      // guide/type-safety.md:241
      code: "import type { PageParams } from 'void/routes';\nconst { slug } = c.req.param() as PageParams<'/posts/[slug]'>;",
      filename: "pages/posts/[slug].server.ts",
    },
  ],
  invalid: [
    {
      code: "export const loader = defineHandler((c) => ({ id: c.req.param('id') }));",
      filename: "pages/users/[id].server.ts",
      errors: [{ messageId: "byName" }],
    },
    {
      code: "export const action = defineHandler((c) => c.req.param('id'));",
      filename: "pages/users/[id].server.ts",
      errors: [{ messageId: "byName" }],
    },
  ],
});
