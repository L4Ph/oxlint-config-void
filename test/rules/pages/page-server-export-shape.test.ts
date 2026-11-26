import rule from "../../../src/plugin/rules/pages/page-server-export-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("page-server-export-shape", rule, {
  valid: [
    { code: "export const loader = defineHandler(() => ({}));", filename: "pages/a.server.ts" },
    {
      code: "export const action = defineHandler.withValidator({ body })((c, { body }) => body);",
      filename: "pages/a.server.ts",
    },
    {
      code: "export const actions = { save: defineHandler(() => ({})) };",
      filename: "pages/a.server.ts",
    },
    {
      // A handler built elsewhere is not judged.
      code: "import { shared } from './_shared';\nexport const loader = shared;\nexport const action = makeAction();",
      filename: "pages/a.server.ts",
    },
    { code: "export const loader = async (c) => ({});", filename: "routes/a.ts" },
    {
      // guide/pages-routing/actions-and-forms.md:15-22
      code: `import { users, insertUserSchema } from '@schema';
import { defineHandler } from 'void';
import { db } from 'void/db';

export const action = defineHandler.withValidator({
  body: insertUserSchema,
})(async (c, { body }) => {
  await db.insert(users).values(body);
});`,
      filename: "pages/users/index.server.ts",
    },
  ],
  invalid: [
    {
      code: "export const loader = async (c) => ({});",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "handler" }],
    },
    {
      code: "export async function action(c) {}",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "handler" }],
    },
    {
      code: "export const action = defineHandler(() => ({}));\nexport const actions = {};",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "both" }],
    },
    {
      code: "export const actions = {};\nexport const action = defineHandler(() => ({}));",
      filename: "pages/b.server.ts",
      errors: [{ messageId: "both" }],
    },
    {
      code: "export const actions = { save: async (c) => ({}) };",
      filename: "pages/c.server.ts",
      errors: [{ messageId: "handler" }],
    },
  ],
});
