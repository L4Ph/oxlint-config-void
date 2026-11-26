import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/imports/no-cloudflare-workers-import.ts";
import { RuleTester } from "../../rule-tester.ts";

const fixture = (path: string) => fileURLToPath(new URL(`./fixtures/${path}`, import.meta.url));
const code = "import { env } from 'cloudflare:workers';";

new RuleTester().run("no-cloudflare-workers-import", rule, {
  valid: [
    {
      code: "export const GET = defineHandler((c) => c.env.DB);",
      filename: fixture("native-app/routes/api.ts"),
    },
    { code: "import { db } from 'void/db';", filename: fixture("native-app/routes/api.ts") },
    // Not governed: a native app's helper outside routes/ and middleware/.
    { code, filename: fixture("native-app/lib/env.ts") },
    // TanStack Start imports bindings from cloudflare:workers (integrations/cloudflare.md:20-25).
    { code, filename: fixture("tanstack-app/routes/api.ts") },
    // SvelteKit 3 supports these imports (guide/database/d1.md:369).
    { code, filename: fixture("sveltekit3-app/src/lib/db.ts") },
    {
      // integrations/cloudflare.md:12-20 (a route using c.env).
      code: "import { defineHandler } from 'void';\nexport const GET = defineHandler(async (c) => {\n  const { results } = await c.env.DB.prepare('SELECT * FROM users').all();\n  return c.json({ users: results });\n});",
      filename: fixture("native-app/routes/api/users.ts"),
    },
  ],
  invalid: [
    { code, filename: fixture("native-app/routes/api.ts"), errors: [{ messageId: "routes" }] },
    {
      code,
      filename: fixture("native-app/middleware/01.x.ts"),
      errors: [{ messageId: "routes" }],
    },
    {
      code: "const { env } = await import('cloudflare:workers');",
      filename: fixture("nuxt-app/server/api/users.get.ts"),
      errors: [{ messageId: "framework" }],
    },
    {
      code,
      filename: fixture("sveltekit2-app/src/lib/db.ts"),
      errors: [{ messageId: "framework" }],
    },
  ],
});
