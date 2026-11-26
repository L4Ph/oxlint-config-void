import rule from "../../../src/plugin/rules/auth/require-auth-throw-redirect-literal.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { requireAuth } from 'void/auth';\n";

new RuleTester().run("require-auth-throw-redirect-literal", rule, {
  valid: [
    { code: `${head}requireAuth(c, { throwRedirect: '/login' });`, filename: "pages/a.server.ts" },
    { code: `${head}requireAuth(c);`, filename: "routes/a.ts" },
    // Validated by the app before it is passed on.
    {
      code: `${head}export const GET = defineHandler((c) => {\n  const next = safePath(c.req.query('next'));\n  requireAuth(c, { throwRedirect: next });\n});`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}export const GET = defineHandler((c) => { requireAuth(c, { throwRedirect: safePath(c.req.query('next')) }); });`,
      filename: "routes/a.ts",
    },
    // Not governed: a requireAuth that is not Void's.
    {
      code: "import { requireAuth } from './mine';\nrequireAuth(c, { throwRedirect: c.req.query('next') });",
      filename: "routes/a.ts",
    },
    {
      // reference/api/auth.md:101-104 (a trusted destination in a loader).
      code: `import { defineHandler } from 'void';\n${head}export const loader = defineHandler((c) => {\n  const user = requireAuth(c, { throwRedirect: '/login' });\n  return { email: user.email };\n});`,
      filename: "pages/account.server.ts",
    },
  ],
  invalid: [
    {
      code: `${head}requireAuth(c, { throwRedirect: c.req.query('next') });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "fromRequest" }],
    },
    {
      code: `import { defineHandler } from 'void';\n${head}export const GET = defineHandler.withValidator({ query })((c, input) => {\n  requireAuth(c, { throwRedirect: input.query.redirectTo });\n});`,
      filename: "routes/a.ts",
      errors: [{ messageId: "fromRequest" }],
    },
    {
      code: `${head}export const GET = defineHandler.withValidator({ query })((c, { query }) => {\n  requireAuth(c, { throwRedirect: query.next ?? '/login' });\n});`,
      filename: "routes/a.ts",
      errors: [{ messageId: "fromRequest" }],
    },
  ],
});
