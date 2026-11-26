import rule from "../../../src/plugin/rules/placement/schema-file-layout.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { sqliteTable } from 'void/schema-d1';\n";

new RuleTester().run("schema-file-layout", rule, {
  valid: [
    { code: `${IMPORT}export const users = sqliteTable('users', {});`, filename: "db/schema.ts" },
    {
      code: `${IMPORT}export const posts = sqliteTable('posts', {});`,
      filename: "db/schema/posts.ts",
    },
    { code: "export * from './schema/users';", filename: "db/schema.ts" },
    { code: "export const t = pgTable('t', {});", filename: "lib/schema.ts" },
    {
      code: `${IMPORT}export const users = sqliteTable('users', {});`,
      filename: "src/db/schema.test.ts",
    },
    // guide/database.md line 104 (barrel file)
    {
      code: 'export * from "./schema/users";\nexport * from "./schema/posts";',
      filename: "db/schema.ts",
    },
    // guide/database.md line 59 (Schema Definition)
    {
      code: `import { sql } from 'void/db';\nimport { sqliteTable, text, integer } from 'void/schema-d1';\n\nexport const users = sqliteTable('users', {\n  id: integer('id').primaryKey({ autoIncrement: true }),\n  name: text('name').notNull(),\n});`,
      filename: "db/schema.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export const users = sqliteTable('users', {});`,
      filename: "routes/_users/tables.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: "import { pgTable } from 'void/schema-pg';\nexport const t = pgTable('t', {});",
      filename: "lib/schema.ts",
      errors: [{ messageId: "location" }],
    },
    { code: "export {};", filename: "db/schema.ts", errors: [{ messageId: "barrel" }] },
    {
      code: "import './schema/users';",
      filename: "db/schema.ts",
      errors: [{ messageId: "barrel" }],
    },
  ],
});
