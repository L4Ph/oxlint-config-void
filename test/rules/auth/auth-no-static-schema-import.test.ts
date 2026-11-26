import rule from "../../../src/plugin/rules/auth/auth-no-static-schema-import.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("auth-no-static-schema-import", rule, {
  valid: [
    {
      code: "export default { hooks: { after: async () => { const { userTable } = await import('@auth-schema'); } } };",
      filename: "auth.ts",
    },
    { code: "import type { User } from 'better-auth';", filename: "auth.ts" },
    { code: "import type { userTable } from '@auth-schema';", filename: "auth.ts" },
    // Not governed: any file other than the root auth.ts.
    { code: "import { userTable } from '@auth-schema';", filename: "src/users.ts" },
    {
      // reference/api/auth.md:15-22 (defineAuth comes from void/auth).
      code: "import { defineAuth } from 'void/auth';\n\nexport default defineAuth(({ defaults }) => ({\n  ...defaults,\n  trustedOrigins: ['https://example.com'],\n}));",
      filename: "auth.ts",
    },
  ],
  invalid: [
    {
      code: "import { userTable } from '@auth-schema';",
      filename: "auth.ts",
      errors: [{ messageId: "schema" }],
    },
    {
      code: "import type { AuthUser } from 'void/auth';",
      filename: "auth.ts",
      errors: [{ messageId: "voidAuth" }],
    },
    {
      code: "import { defineAuth, getUser } from 'void/auth';",
      filename: "auth.ts",
      errors: [{ messageId: "voidAuth" }],
    },
  ],
});
