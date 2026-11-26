import rule from "../../../src/plugin/rules/database/db-session-in-request-scope.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("db-session-in-request-scope", rule, {
  valid: [
    {
      code: "export default defineMiddleware(async (c, next) => { setSession('first-primary'); await next(); });",
      filename: "middleware/01.db.ts",
    },
    {
      code: "export const GET = defineHandler((c) => { const d = createDb(c.env.DB, { session: 'first-primary' }); return 1; });",
      filename: "routes/a.ts",
    },
    { code: "const f = () => setSession('first-primary');", filename: "lib/other.ts" },
    {
      // reference/api/database.md line 36: a module-level client without a session option.
      code: "import { env } from 'cloudflare:workers';\nimport { createDb } from 'void/db';\nconst db = createDb(env.MY_OTHER_DB);",
      filename: "lib/db.ts",
    },
    {
      // guide/database/d1.md line 84: created inside the handler.
      code: `import { createDb } from 'void/db';
export const GET = defineHandler(async () => {
  const primaryDb = createDb(env.DB, { session: 'first-primary' });
  return primaryDb.select().from(users).all();
});`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: "setSession('first-primary');",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "setSession" }],
    },
    {
      code: "const fresh = createDb(env.DB, { session: 'first-primary' });",
      filename: "routes/a.ts",
      errors: [{ messageId: "createDb" }],
    },
    {
      code: "const b = getBookmark();",
      filename: "lib/a.ts",
      errors: [{ messageId: "getBookmark" }],
    },
  ],
});
