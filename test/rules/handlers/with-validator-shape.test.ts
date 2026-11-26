import rule from "../../../src/plugin/rules/handlers/with-validator-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineHandler } from 'void';\n";

new RuleTester().run("with-validator-shape", rule, {
  valid: [
    {
      code: `${head}export const POST = defineHandler.withValidator({ body })((c, { body }) => body);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}const v = defineHandler.withValidator({ query });\nexport const GET = v((c, { query }) => query);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}export const POST = defineHandler.withValidator({ body, query })((c, i) => i);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}export const GET = defineHandler.withValidator({ params })((c, i) => i);`,
      filename: "routes/a.ts",
    },
    // A file the rule does not govern: no import of defineHandler from Void.
    {
      code: "export const POST = defineHandler.withValidator({ json });",
      filename: "src/other.ts",
    },
    {
      // reference/api/handlers.md:48-58 (withValidator with a body schema, then the handler).
      code: `import * as v from 'valibot';\n${head}export const POST = defineHandler.withValidator({\n  body: v.object({ name: v.pipe(v.string(), v.minLength(1)) }),\n})((c, { body }) => {\n  return { received: body.name };\n});`,
      filename: "routes/api/users.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const POST = defineHandler.withValidator({ body }, (c, { body }) => body);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "extraArgument" }],
    },
    {
      code: `${head}export const POST = defineHandler.withValidator({ body });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "notCalled" }],
    },
    {
      code: `${head}export const POST = defineHandler.withValidator({ json })((c, i) => i);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "unknownSlot" }],
    },
    {
      code: `${head}export const GET = defineHandler.withValidator({ headers })((c, i) => i);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "unknownSlot" }],
    },
  ],
});
