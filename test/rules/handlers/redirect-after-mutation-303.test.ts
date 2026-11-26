import rule from "../../../src/plugin/rules/handlers/redirect-after-mutation-303.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { HTTPException } from 'hono/http-exception';\n";

new RuleTester().run("redirect-after-mutation-303", rule, {
  valid: [
    {
      code: `import { defineHandler } from 'void';\nexport const POST = defineHandler((c) => c.redirect('/done', 303));`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}export const GET = defineHandler((c) => { throw new HTTPException(302, { res: c.redirect('/login') }); });`,
      filename: "routes/a.ts",
    },
    // A file the rule does not govern: a helper outside routes/ and pages/.
    {
      code: `${head}export function f(c) { throw new HTTPException(302, { res: c.redirect('/login') }); }`,
      filename: "lib/guard.ts",
    },
    {
      // integrations/hono.md:126, the 303 form, inside a POST handler.
      code: `${head}export const POST = defineHandler((c) => {\n  throw new HTTPException(303, { res: c.redirect('/login', 303) });\n});`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const POST = defineHandler((c) => { throw new HTTPException(302, { res: c.redirect('/login', 302) }); });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "status" }, { messageId: "resStatus" }],
    },
    {
      code: `${head}export const action = defineHandler((c) => { throw new HTTPException(303, { res: c.redirect('/login') }); });`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "resStatus" }],
    },
  ],
});
