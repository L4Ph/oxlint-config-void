import rule from "../../../src/plugin/rules/frameworks/nuxt-no-void-in-client.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("nuxt-no-void-in-client", rule, {
  valid: [
    { code: "import { db } from 'void/db';", filename: "server/api/users.get.ts" },
    { code: "import { ref } from 'vue';", filename: "components/Card.vue" },
    { code: "import type { Db } from 'void/db';", filename: "composables/useDb.ts" },
    { code: "import { kv } from 'void/kv';", filename: "server/utils/cache.ts" },
    // A `.server` component renders on the server only.
    { code: "import { db } from 'void/db';", filename: "components/Users.server.ts" },
    {
      // integrations/frameworks/nuxt.md, lines 85-92 (Database)
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
      code: "import { db } from 'void/db';",
      filename: "components/UserList.vue",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { kv } from 'void/kv';",
      filename: "composables/useKv.ts",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { ai } from 'void/ai';",
      filename: "app/plugins/ai.ts",
      errors: [{ messageId: "client" }],
    },
  ],
});
