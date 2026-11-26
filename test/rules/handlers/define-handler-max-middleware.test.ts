import rule from "../../../src/plugin/rules/handlers/define-handler-max-middleware.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineHandler } from 'void';\n";

new RuleTester().run("define-handler-max-middleware", rule, {
  valid: [
    { code: `${head}export const GET = defineHandler(a, b, (c) => 1);`, filename: "routes/a.ts" },
    {
      code: `${head}export const GET = defineHandler(m1, m2, m3, m4, m5, (c) => 1);`,
      filename: "routes/a.ts",
    },
    // A file the rule does not govern: a call of some other function named defineHandler.
    {
      code: "export const GET = defineHandler(a, b, c, d, e, f, g);",
      filename: "src/other.ts",
    },
    {
      // reference/api/handlers.md:33: two middleware and a handler.
      code: `${head}export const GET = defineHandler(authMiddleware, rateLimiter, (c) => {\n  return { ok: true };\n});`,
      filename: "routes/stats.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const GET = defineHandler(m1, m2, m3, m4, m5, m6, (c) => 1);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "tooMany" }],
    },
    {
      code: `import { defineHandler as dh } from 'void/handler';\nexport const GET = dh(a, b, c, d, e, f, g);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "tooMany" }],
    },
  ],
});
