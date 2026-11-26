import rule from "../../../src/plugin/rules/imports/auth-schema-alias.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("auth-schema-alias", rule, {
  valid: [
    { code: "import { userTable } from '@auth-schema';", filename: "routes/a.ts" },
    { code: "import { sessionTable } from '@auth-schema';", filename: "src/a.ts" },
    // A file with no import of the generated schema.
    { code: "import { db } from 'void/db';", filename: "pages/a.server.ts" },
    {
      // guide/auth.md:161-166 (listing users through the alias).
      code: "import { userTable } from '@auth-schema';\nimport { db, desc } from 'void/db';\nexport function listUsers() {\n  return db.select().from(userTable).orderBy(desc(userTable.createdAt));\n}",
      filename: "src/users.ts",
    },
  ],
  invalid: [
    {
      code: "import { userTable } from '../.void/better-auth-schema';",
      filename: "routes/a.ts",
      errors: [{ messageId: "path" }],
    },
    {
      code: "import { userTable } from '../../.void/better-auth-schema.ts';",
      filename: "src/a/b.ts",
      errors: [{ messageId: "path" }],
    },
  ],
});
