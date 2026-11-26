import rule from "../../../src/plugin/rules/frameworks/sveltekit-no-void-in-client.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("sveltekit-no-void-in-client", rule, {
  valid: [
    { code: "import { db } from 'void/db';", filename: "src/routes/+page.server.ts" },
    { code: "import { x } from './x';", filename: "src/routes/+page.ts" },
    { code: "import { db } from 'void/db';", filename: "src/routes/api/users/+server.ts" },
    { code: "import type { Db } from 'void/db';", filename: "src/routes/+layout.ts" },
    {
      // integrations/frameworks/sveltekit.md, lines 94-102 (Database)
      code: `import { users } from '@schema';
import { db } from 'void/db';

export async function load() {
  return { users: await db.select().from(users) };
}`,
      filename: "src/routes/users/+page.server.ts",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';",
      filename: "src/routes/+page.ts",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { kv } from 'void/kv';",
      filename: "src/routes/+layout.ts",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { storage } from 'void/storage';",
      filename: "src/lib/Upload.svelte",
      errors: [{ messageId: "client" }],
    },
  ],
});
