import rule from "../../../src/plugin/rules/convention-files/route-handler-define-handler.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineHandler } from 'void';\n";

new RuleTester().run("route-handler-define-handler", rule, {
  valid: [
    { code: `${IMPORT}export const GET = defineHandler(() => []);`, filename: "routes/users.ts" },
    {
      code: `${IMPORT}export const POST = defineHandler.withValidator({ body })((c, { body }) => body);`,
      filename: "routes/users.ts",
    },
    { code: "export const GET = async (c) => c.json([]);", filename: "routes/_helpers.ts" },
    { code: "export const GET = async (c) => c.json([]);", filename: "lib/users.ts" },
    { code: "export const GET = makeHandler();", filename: "routes/users.ts" },
    // guide/server-routing.md line 55 (Environment-only routes)
    {
      code: `import { defineHandler } from 'void';\n\nexport const GET = defineHandler((c) => {\n  return { message: 'Hello!', timestamp: Date.now() };\n});`,
      filename: "routes/api/hello.ts",
    },
    // guide/server-routing.md line 276 (per-route middleware first)
    {
      code: `import { defineHandler } from 'void';\nexport const GET = defineHandler(cors({ origin: 'https://app.example.com' }), (c) => ({ ok: true }));`,
      filename: "routes/api/x.ts",
    },
  ],
  invalid: [
    {
      code: "export const GET = async (c) => c.json([]);",
      filename: "routes/users.ts",
      errors: [{ messageId: "bare" }],
    },
    {
      code: "export async function POST(c) { return c.json({}); }",
      filename: "routes/users.ts",
      errors: [{ messageId: "bare" }],
    },
    {
      code: "async function handler(c) {}\nexport { handler as DELETE };",
      filename: "routes/users.ts",
      errors: [{ messageId: "bare" }],
    },
  ],
});
