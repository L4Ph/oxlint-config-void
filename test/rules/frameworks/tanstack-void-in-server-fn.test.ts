import rule from "../../../src/plugin/rules/frameworks/tanstack-void-in-server-fn.ts";
import { RuleTester } from "../../rule-tester.ts";

const imports =
  "import { createServerFn } from '@tanstack/react-start';\nimport { createFileRoute } from '@tanstack/react-router';\nimport { db } from 'void/db';\nimport { kv } from 'void/kv';\n";

new RuleTester().run("tanstack-void-in-server-fn", rule, {
  valid: [
    {
      code: `${imports}const getUsers = createServerFn().handler(async () => db.query.users.findMany());\nexport default function P() { return null; }`,
      filename: "src/routes/index.tsx",
    },
    {
      code: "export default function P() { return null; }",
      filename: "src/routes/about.tsx",
    },
    // A server module with no component is not browser code.
    {
      code: `${imports}export const rows = () => db.query.users.findMany();`,
      filename: "src/lib/users.ts",
    },
    // A route's server handlers run on the server.
    {
      code: `${imports}export const Route = createFileRoute('/api/users')({ server: { handlers: { GET: () => db.query.users.findMany() } } });\nexport default function P() { return null; }`,
      filename: "src/routes/api.users.tsx",
    },
    {
      // integrations/frameworks/tanstack-start.md, lines 57-65 (Database)
      code: `import { users } from '@schema';
import { createServerFn } from '@tanstack/react-start';
import { db } from 'void/db';

const getUsers = createServerFn().handler(async () => {
  return db.select().from(users);
});`,
      filename: "src/routes/users.tsx",
    },
  ],
  invalid: [
    {
      code: `${imports}export const Route = createFileRoute('/')({ loader: () => db.query.users.findMany() });\nexport default function P() { return null; }`,
      filename: "src/routes/index.tsx",
      errors: [{ messageId: "browser" }],
    },
    {
      code: `${imports}export default function P() { const x = kv.get('a'); return null; }`,
      filename: "src/routes/p.tsx",
      errors: [{ messageId: "browser" }],
    },
  ],
});
