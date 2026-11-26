import rule from "../../../src/plugin/rules/imports/use-void-drizzle-modules.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("use-void-drizzle-modules", rule, {
  valid: [
    {
      // Test support builds a database to stand in for `void/db` (guide/testing.md:18).
      code: 'import { drizzle } from "drizzle-orm/d1";\nexport const make = (d1: D1Database) => drizzle(d1);',
      filename: "routes/_test/runtime.ts",
    },
    {
      code: "import { sqliteTable, text } from 'void/schema-d1';",
      filename: "db/schema.ts",
    },
    { code: "import { pgTable } from 'void/schema-pg';", filename: "db/schema.ts" },
    { code: "import { eq, and } from 'void/db';", filename: "routes/a.ts" },
    { code: "import type { SQL } from 'void/db';", filename: "routes/a.ts" },
    { code: "import { db } from 'void/db';", filename: "routes/a.ts" },
    // Not governed: a name Void does not re-export, and migration scripts under db/.
    { code: "import { relations } from 'drizzle-orm';", filename: "db/schema.ts" },
    { code: "import { drizzle } from 'drizzle-orm/d1';", filename: "db/migrations/run.ts" },
    {
      // guide/database.md:46-47 (the D1 schema, helpers from void/schema-d1 and sql from void/db).
      code: "import { sql } from 'void/db';\nimport { sqliteTable, text, integer } from 'void/schema-d1';",
      filename: "db/schema.ts",
    },
    {
      // guide/database.md:296-310 (a derived validator from void/drizzle-zod).
      code: "import { createInsertSchema } from 'void/drizzle-zod';",
      filename: "db/schema.ts",
    },
  ],
  invalid: [
    {
      code: "import { sqliteTable } from 'drizzle-orm/sqlite-core';",
      filename: "db/schema.ts",
      errors: [{ messageId: "schema" }],
    },
    {
      code: "import { pgTable } from 'drizzle-orm/pg-core';",
      filename: "db/schema.ts",
      errors: [{ messageId: "schema" }],
    },
    {
      code: "import { eq } from 'drizzle-orm';",
      filename: "routes/a.ts",
      errors: [{ messageId: "operators" }],
    },
    {
      code: "import type { SQL } from 'drizzle-orm';",
      filename: "routes/a.ts",
      errors: [{ messageId: "operators" }],
    },
    {
      code: "import { drizzle } from 'drizzle-orm/d1';",
      filename: "routes/a.ts",
      errors: [{ messageId: "driver" }],
    },
    {
      code: "import { createInsertSchema } from 'drizzle-zod';",
      filename: "db/schema.ts",
      errors: [{ messageId: "validator" }],
    },
  ],
});
