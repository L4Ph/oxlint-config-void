import rule from "../../../src/plugin/rules/auth/prefer-require-auth-redirect.ts";
import { RuleTester } from "../../rule-tester.ts";

const head =
  "import { HTTPException } from 'hono/http-exception';\nimport { getUser } from 'void/auth';\n";

new RuleTester().run("prefer-require-auth-redirect", rule, {
  valid: [
    {
      code: "import { requireAuth } from 'void/auth';\nconst user = requireAuth(c, { throwRedirect: '/login' });",
      filename: "routes/a.ts",
    },
    { code: `${head}const user = getUser();`, filename: "routes/a.ts" },
    // A guard that throws something else than the login redirect.
    {
      code: `${head}export function f(c) { if (!getUser()) throw new HTTPException(403, { message: 'no' }); }`,
      filename: "routes/a.ts",
    },
    {
      // integrations/hono.md:113-123: the docs' hand-written guard lives in lib/, which is not governed.
      code: `${head}export function requirePageUser(c) {\n  const user = getUser();\n  if (!user) {\n    throw new HTTPException(302, { res: c.redirect('/login') });\n  }\n  return user;\n}`,
      filename: "lib/require-page-user.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const GET = defineHandler((c) => { if (!getUser()) throw new HTTPException(303, { res: c.redirect('/login', 303) }); });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "guard" }],
    },
    {
      code: `${head}export const loader = defineHandler((c) => {\n  const u = getUser();\n  if (!u) throw new HTTPException(302, { res: c.redirect('/login') });\n  return { u };\n});`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "guard" }],
    },
  ],
});
