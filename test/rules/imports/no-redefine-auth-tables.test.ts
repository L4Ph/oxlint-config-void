import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/imports/no-redefine-auth-tables.ts";
import { RuleTester } from "../../rule-tester.ts";

const fixture = (path: string) => fileURLToPath(new URL(`./fixtures/${path}`, import.meta.url));
const head = "import { sqliteTable, text } from 'void/schema-d1';\n";

new RuleTester().run("no-redefine-auth-tables", rule, {
  valid: [
    {
      code: `${head}export const posts = sqliteTable('posts', {});`,
      filename: fixture("auth-app/db/schema.ts"),
    },
    {
      code: `${head}export const sessionsLog = sqliteTable('session_log', {});`,
      filename: fixture("auth-app/db/schema.ts"),
    },
    // Not governed: an app without auth may name its own table `user`.
    {
      code: `${head}export const user = sqliteTable('user', {});`,
      filename: fixture("noauth-app/db/schema.ts"),
    },
    // Not governed: a file that is not part of the schema.
    {
      code: `${head}export const user = sqliteTable('user', {});`,
      filename: fixture("auth-app/routes/a.ts"),
    },
    {
      // guide/auth.md:171-178 (a table that references userTable.id, named `post`).
      code: `import { userTable } from '@auth-schema';\n${head}export const postTable = sqliteTable('post', {\n  id: text('id').primaryKey(),\n  userId: text('user_id').notNull().references(() => userTable.id, { onDelete: 'cascade' }),\n});`,
      filename: fixture("auth-app/db/schema.ts"),
    },
  ],
  invalid: [
    {
      code: `${head}export const user = sqliteTable('user', {});`,
      filename: fixture("auth-app/db/schema.ts"),
      errors: [{ messageId: "redefined" }],
    },
    {
      code: "import { pgTable } from 'void/schema-pg';\nexport const s = pgTable('session', {});",
      filename: fixture("auth-app/db/schema/auth.ts"),
      errors: [{ messageId: "redefined" }],
    },
  ],
});
