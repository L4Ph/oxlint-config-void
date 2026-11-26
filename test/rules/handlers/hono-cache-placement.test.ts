import rule from "../../../src/plugin/rules/handlers/hono-cache-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { cache } from 'hono/cache';\nimport { defineHandler } from 'void';\n";

new RuleTester().run("hono-cache-placement", rule, {
  valid: [
    {
      code: `${head}export const GET = defineHandler(cache({ cacheName: 'p' }), () => []);`,
      filename: "routes/a.ts",
    },
    { code: "import { getUser } from 'void/auth';", filename: "routes/a.ts" },
    { code: "export const revalidate = 60;", filename: "pages/home.server.ts" },
    {
      // The cache applies to GET only; the POST reads the user.
      code: `import { getUser } from 'void/auth';\n${head}export const GET = defineHandler(cache({}), () => []);\nexport const POST = defineHandler(() => getUser());`,
      filename: "routes/products.ts",
    },
    // A file the rule does not govern: hono/cache outside routes/ and pages/.
    { code: "import { cache } from 'hono/cache';", filename: "lib/cache.ts" },
    {
      // integrations/hono.md:29-34 (per-route cache of data that is the same for everyone).
      code: `import { cache } from 'hono/cache';\nimport { defineHandler } from 'void';\nimport { listProducts } from '../../lib/products';\nexport const GET = defineHandler(\n  cache({ cacheName: 'products', cacheControl: 'max-age=3600' }),\n  async () => ({ products: await listProducts() }),\n);`,
      filename: "routes/api/products.ts",
    },
  ],
  invalid: [
    {
      code: `import { getUser } from 'void/auth';\n${head}export const GET = defineHandler(cache({}), () => getUser());`,
      filename: "routes/a.ts",
      errors: [{ messageId: "userRoute" }],
    },
    {
      code: `${head}export const GET = defineHandler(cache({}), (c) => c.req.header('cookie'));`,
      filename: "routes/a.ts",
      errors: [{ messageId: "userRoute" }],
    },
    {
      code: "import { cache } from 'hono/cache';",
      filename: "pages/home.server.ts",
      errors: [{ messageId: "page" }],
    },
    {
      code: "import 'hono/cache';",
      filename: "pages/a/b.server.ts",
      errors: [{ messageId: "page" }],
    },
  ],
});
