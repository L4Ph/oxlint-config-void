import rule from "../../../src/plugin/rules/handlers/http-exception-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { HTTPException } from 'hono/http-exception';\n";

new RuleTester().run("http-exception-shape", rule, {
  valid: [
    { code: `${head}throw new HTTPException(404, { message: 'no' });`, filename: "routes/a.ts" },
    {
      code: `${head}throw new HTTPException(303, { res: c.redirect('/login', 303) });`,
      filename: "routes/a.ts",
    },
    { code: `${head}function f(c) { return c.redirect('/home'); }`, filename: "routes/a.ts" },
    // A file the rule does not govern: HTTPException is not Hono's here.
    { code: "throw new HTTPException(200);", filename: "src/other.ts" },
    {
      // guide/pages-routing/errors.md:99-104 (a 403 in a page loader).
      code: `${head}export const loader = defineHandler(() => {\n  throw new HTTPException(403, { message: 'Your account is suspended' });\n});`,
      filename: "pages/account.server.ts",
    },
    {
      // integrations/hono.md:113-122 (a 302 carrying the redirect in res).
      code: `${head}export function requirePageUser(c, user) {\n  if (!user) {\n    throw new HTTPException(302, { res: c.redirect('/login') });\n  }\n}`,
      filename: "lib/require-page-user.ts",
    },
  ],
  invalid: [
    {
      code: `${head}throw new HTTPException(200);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "status" }],
    },
    {
      code: `${head}throw new HTTPException(302);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "redirectWithoutRes" }],
    },
    {
      code: `${head}throw new HTTPException(302, { message: 'login' });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "redirectWithoutRes" }],
    },
    {
      code: `${head}function f(c) { throw c.redirect('/login'); }`,
      filename: "routes/a.ts",
      errors: [{ messageId: "throwRedirect" }],
    },
  ],
});
