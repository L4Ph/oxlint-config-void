import rule from "../../../src/plugin/rules/frameworks/react-router-void-in-loaders-only.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("react-router-void-in-loaders-only", rule, {
  valid: [
    {
      code: "import { db } from 'void/db';\nexport async function loader() { return db.query.users.findMany(); }\nexport default function Users() { return null; }",
      filename: "app/routes/users.tsx",
    },
    // Not a route file.
    {
      code: "import { env } from 'void/env';\nexport const secret = env.STRIPE_SECRET;",
      filename: "app/server.ts",
    },
    // A client-exposed key may be read anywhere.
    {
      code: "import { env } from 'void/env';\nexport default function P() { return <p>{env.VITE_NAME}</p>; }",
      filename: "app/routes/home.tsx",
    },
    // A local `db` is not the import.
    {
      code: "import { db } from 'void/db';\nexport async function loader() { return db; }\nexport default function P({ db }) { return db.name; }",
      filename: "app/routes/p.tsx",
    },
    {
      // integrations/frameworks/react-router.md, lines 55-63 (Database)
      code: `import { users } from '@schema';
import { db } from 'void/db';
import type { Route } from './+types/users';

export async function loader({}: Route.LoaderArgs) {
  return { users: await db.select().from(users) };
}`,
      filename: "app/routes/users.tsx",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';\nexport default function Users() { const rows = db.query.users.findMany(); return null; }",
      filename: "app/routes/users.tsx",
      errors: [{ messageId: "helper" }],
    },
    {
      code: "import { env } from 'void/env';\nexport default function P() { return <p>{env.STRIPE_SECRET}</p>; }",
      filename: "app/routes/p.tsx",
      errors: [{ messageId: "secret" }],
    },
    {
      code: "import { kv } from 'void/kv';\nconst Page = () => { const v = kv.get('a'); return null; };\nexport default Page;",
      filename: "app/routes/page.tsx",
      errors: [{ messageId: "helper" }],
    },
  ],
});
