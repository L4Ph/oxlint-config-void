import rule from "../../../src/plugin/rules/database/db-batch-not-empty.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("db-batch-not-empty", rule, {
  valid: [
    {
      code: "import { db } from 'void/db';\nawait db.batch([db.insert(t).values(a)]);",
      filename: "routes/a.ts",
    },
    { code: "import { db } from 'void/db';\nawait db.batch(queries);", filename: "routes/a.ts" },
    // Not the Void db: imported from elsewhere.
    { code: "import { db } from './mine';\nawait db.batch([]);", filename: "routes/a.ts" },
    {
      // reference/api/database.md line 126: a batch with one query.
      code: `import { posts } from '@schema';
import { db } from 'void/db';
const writes = [db.update(posts).set({ published: true })];
await db.batch(writes);`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';\nawait db.batch([]);",
      filename: "routes/a.ts",
      errors: [{ messageId: "empty" }],
    },
    {
      code: "import { db } from 'void/db';\nawait db.batch( [] );",
      filename: "routes/a.ts",
      errors: [{ messageId: "empty" }],
    },
    {
      code: "import { db } from 'void/db';\nawait db.batch([] as never);",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "empty" }],
    },
  ],
});
