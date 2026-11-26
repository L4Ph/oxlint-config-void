import rule from "../../../src/plugin/rules/frameworks/analog-void-import-server-only.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("analog-void-import-server-only", rule, {
  valid: [
    { code: "import { db } from 'void/db';", filename: "src/app/pages/index.server.ts" },
    { code: "import { db } from 'void/db';", filename: "src/server/routes/api/users.ts" },
    // A type import carries nothing into the bundle.
    { code: "import type { Db } from 'void/db';", filename: "src/app/shared/types.ts" },
    { code: "import { ref } from 'vue';", filename: "src/app/shared/store.ts" },
    { code: "import { db } from 'void/db';", filename: "src/app/shared/store.spec.ts" },
    {
      // integrations/frameworks/analog.md, lines 87-96 (Database)
      code: `import type { PageServerLoad } from '@analogjs/router';
import { users } from '@schema';
import { db } from 'void/db';

export const load = async ({ event }: PageServerLoad) => {
  return { users: await db.select().from(users) };
};`,
      filename: "src/app/pages/users.server.ts",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';",
      filename: "src/app/pages/index.page.ts",
      errors: [{ messageId: "browser" }],
    },
    {
      code: "import { kv } from 'void/kv';",
      filename: "src/app/shared/store.ts",
      errors: [{ messageId: "browser" }],
    },
  ],
});
