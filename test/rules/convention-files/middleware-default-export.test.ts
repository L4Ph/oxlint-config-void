import rule from "../../../src/plugin/rules/convention-files/middleware-default-export.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineMiddleware } from 'void';\n";

new RuleTester().run("middleware-default-export", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineMiddleware(async (c, next) => { await next(); });`,
      filename: "middleware/01.logger.ts",
    },
    {
      code: "import { basicAuth } from 'void';\nexport default basicAuth({ username: () => 'u', password: () => 'p' });",
      filename: "middleware/02.gate.ts",
    },
    { code: "export const x = 1;", filename: "middleware/_shared.ts" },
    { code: "export const x = 1;", filename: "lib/mw.ts" },
    // guide/server-routing.md line 225 (Global middleware)
    {
      code: `import { defineMiddleware } from 'void';\n\nexport default defineMiddleware(async (c, next) => {\n  console.log(c.req.method, c.req.path);\n  await next();\n});`,
      filename: "middleware/01.logger.ts",
    },
    // integrations/hono.md line 18 (Built-in Middleware)
    {
      code: `import { cors } from 'hono/cors';\nimport { defineMiddleware } from 'void';\n\nexport default defineMiddleware(cors({ origin: 'https://example.com' }));`,
      filename: "middleware/01.cors.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export const mw = defineMiddleware(async (c, next) => next());`,
      filename: "middleware/01.logger.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default async (c, next) => next();",
      filename: "middleware/01.logger.ts",
      errors: [{ messageId: "plain" }],
    },
  ],
});
