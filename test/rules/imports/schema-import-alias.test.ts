import rule from "../../../src/plugin/rules/imports/schema-import-alias.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("schema-import-alias", rule, {
  valid: [
    { code: "import { users } from '@schema';", filename: "routes/a.ts" },
    { code: "import { db } from 'void/db';", filename: "routes/a.ts" },
    { code: "import { x } from '../lib/schema';", filename: "routes/a.ts" },
    // Not governed: files under db/ and the root config reach the schema by path.
    { code: "export * from './schema/users';", filename: "db/schema.ts" },
    { code: "import * as schema from './db/schema';", filename: "drizzle.config.ts" },
    {
      // guide/database.md:146-150 (db from void/db, tables from @schema).
      code: "import { users } from '@schema';\nimport { db } from 'void/db';",
      filename: "src/users.ts",
    },
  ],
  invalid: [
    {
      code: "import { users } from '../../db/schema';",
      filename: "routes/api/users/index.ts",
      errors: [{ messageId: "relative" }],
    },
    {
      code: "import { posts } from '../db/schema/posts';",
      filename: "routes/api.ts",
      errors: [{ messageId: "relative" }],
    },
    {
      code: "import { posts } from '../db/schema.ts';",
      filename: "src/posts.ts",
      errors: [{ messageId: "relative" }],
    },
  ],
});
