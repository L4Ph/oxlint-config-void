import rule from "../../../src/plugin/rules/imports/auth-imports-from-void.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("auth-imports-from-void", rule, {
  valid: [
    { code: "import { getUser, requireAuth } from 'void/auth';", filename: "routes/a.ts" },
    { code: "import { auth } from 'void/client';", filename: "pages/a.tsx" },
    { code: "import { auth } from 'void/client/react';", filename: "pages/a.tsx" },
    {
      code: "import { createAuthClient } from 'void/client';\nexport const c = createAuthClient({ plugins: [] });",
      filename: "src/auth-client.ts",
    },
    {
      code: "const result = await getAuth(c).api.listSessions({ headers: c.req.raw.headers });",
      filename: "routes/a.ts",
    },
    // auth.ts itself: Better Auth's own types are what reference/api/auth.md:152 asks for.
    { code: "import type { User, Session } from 'better-auth';", filename: "auth.ts" },
    // Not governed: a local module named like a helper.
    { code: "import { getUser } from './session';", filename: "routes/a.ts" },
    {
      // reference/api/auth.md:60-62 (getSession from void/auth).
      code: "import { getSession } from 'void/auth';\nconst state = getSession();",
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: "import { getUser } from 'void';",
      filename: "routes/a.ts",
      errors: [{ messageId: "server" }],
    },
    {
      code: "import { requireAuth } from 'void/handler';",
      filename: "routes/a.ts",
      errors: [{ messageId: "server" }],
    },
    {
      code: "import { auth } from 'void';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { createAuthClient } from 'better-auth/react';",
      filename: "src/auth-client.ts",
      errors: [{ messageId: "betterAuthClient" }],
    },
    {
      code: "import { betterAuth } from 'better-auth';\nexport const a = betterAuth({});",
      filename: "src/auth.ts",
      errors: [{ messageId: "instance" }],
    },
    {
      code: "import type { User } from 'better-auth';",
      filename: "routes/a.ts",
      errors: [{ messageId: "types" }],
    },
  ],
});
