import rule from "../../../src/plugin/rules/convention-files/route-has-handler-export.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("route-has-handler-export", rule, {
  valid: [
    { code: "export const parse = () => 1;", filename: "routes/_helpers.ts" },
    { code: "export const GET = defineHandler(() => []);", filename: "routes/users.ts" },
    { code: "export const parse = () => 1;", filename: "lib/format.ts" },
    { code: "export * from './_all';", filename: "routes/all.ts" },
    { code: "export const parse = () => 1;", filename: "routes/_internal/format.ts" },
    // guide/server-routing.md line 68 (A file can export multiple methods)
    {
      code: `import { users } from '@schema';\nimport { defineHandler } from 'void';\nimport { db } from 'void/db';\n\nexport const GET = defineHandler(async () => {\n  return await db.select().from(users);\n});\n\nexport const POST = defineHandler(async (c) => {\n  return { created: true };\n});`,
      filename: "routes/api/users/index.ts",
    },
  ],
  invalid: [
    {
      code: "export const parse = () => 1;",
      filename: "routes/helpers.ts",
      errors: [{ messageId: "none" }],
    },
    {
      code: "export function format() {}",
      filename: "routes/api/format.ts",
      errors: [{ messageId: "none" }],
    },
  ],
});
