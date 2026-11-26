import rule from "../../../src/plugin/rules/frameworks/no-void-auth-in-framework-apps.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-void-auth-in-framework-apps", rule, {
  valid: [
    { code: "import { betterAuth } from 'better-auth';", filename: "server/utils/auth.ts" },
    { code: "import { db } from 'void/db';", filename: "server/api/users.get.ts" },
    // `void/client` without the auth client.
    { code: "import { fetch } from 'void/client';", filename: "app/lib/api.ts" },
    // A type reaches no run-time helper.
    { code: "import type { AuthUser } from 'void/auth';", filename: "app/lib/types.ts" },
    {
      // integrations/frameworks/nuxt.md, lines 85-92 (Database): void/db in a server route, no auth
      code: `import { users } from '@schema';
import { db } from 'void/db';

export default defineEventHandler(async () => {
  return db.select().from(users);
});`,
      filename: "server/api/users.get.ts",
    },
  ],
  invalid: [
    {
      code: "import { getUser } from 'void/auth';",
      filename: "server/api/me.get.ts",
      errors: [{ messageId: "auth" }],
    },
    {
      code: "import { auth } from 'void/client';",
      filename: "src/pages/login.astro",
      errors: [{ messageId: "auth" }],
    },
    {
      code: "import { defineAuth } from 'void/auth';\nexport default defineAuth(() => ({}));",
      filename: "auth.ts",
      errors: [{ messageId: "auth" }],
    },
    {
      code: "import { auth } from 'void/client/react';",
      filename: "app/routes/login.tsx",
      errors: [{ messageId: "auth" }],
    },
  ],
});
