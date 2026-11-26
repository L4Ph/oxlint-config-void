import rule from "../../../src/plugin/rules/frameworks/astro-prerender-false.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("astro-prerender-false", rule, {
  valid: [
    {
      code: "import { db } from 'void/db';\nexport const prerender = false;",
      filename: "src/pages/api/users.ts",
    },
    { code: "const x = 1;", filename: "src/pages/about.astro" },
    // Outside src/pages the page rule does not apply.
    { code: "import { db } from 'void/db';", filename: "src/lib/users.ts" },
    // A private file is not a page.
    { code: "import { db } from 'void/db';", filename: "src/pages/_users.ts" },
    // A type import reaches no binding.
    { code: "import type { Db } from 'void/db';", filename: "src/pages/api/users.ts" },
    {
      // integrations/frameworks/astro.md, lines 87-98 (Database)
      code: `import { users } from '@schema';
import type { APIRoute } from 'astro';
import { db } from 'void/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  const rows = await db.select().from(users);
  return Response.json(rows);
};`,
      filename: "src/pages/api/users.ts",
    },
    {
      // integrations/frameworks/astro.md, lines 116-126 (Accessing Bindings Directly)
      code: `import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { results } = await env.DB.prepare('SELECT * FROM users').all();
  return Response.json(results);
};`,
      filename: "src/pages/api/raw.ts",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';\nexport const GET = () => db;",
      filename: "src/pages/api/users.ts",
      errors: [{ messageId: "prerender" }],
    },
    {
      code: "import { env } from 'cloudflare:workers';\nexport const prerender = true;",
      filename: "src/pages/api/raw.js",
      errors: [{ messageId: "prerender" }],
    },
    {
      code: "import { kv } from 'void/kv';\n",
      filename: "src/pages/users.astro",
      errors: [{ messageId: "prerender" }],
    },
  ],
});
