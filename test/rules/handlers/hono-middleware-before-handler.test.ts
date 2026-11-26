import rule from "../../../src/plugin/rules/handlers/hono-middleware-before-handler.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { cache } from 'hono/cache';\nimport { defineHandler } from 'void';\n";

new RuleTester().run("hono-middleware-before-handler", rule, {
  valid: [
    {
      code: `${head}export const GET = defineHandler(cache({ cacheName: 'p' }), (c) => 1);`,
      filename: "routes/a.ts",
    },
    { code: `${head}export const GET = defineHandler((c) => 1);`, filename: "routes/a.ts" },
    // A file the rule does not govern: a page companion.
    {
      code: `${head}export const GET = defineHandler((c) => { cache({ cacheName: 'p' }); return 1; });`,
      filename: "pages/a.server.ts",
    },
    {
      // integrations/hono.md:61-69 (a Hono helper that is not middleware, called in the handler).
      code: "import { stream } from 'hono/streaming';\nimport { defineHandler } from 'void';\nexport const GET = defineHandler((c) => {\n  return stream(c, async (stream) => {\n    await stream.write('chunk 1');\n  });\n});",
      filename: "routes/api/download.ts",
    },
    {
      // integrations/hono.md:29-34 (per-route cache).
      code: `${head}export const GET = defineHandler(\n  cache({ cacheName: 'products', cacheControl: 'max-age=3600' }),\n  async () => ({ products: [] }),\n);`,
      filename: "routes/api/products.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const GET = defineHandler((c) => { cache({ cacheName: 'p' }); return 1; });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "insideHandler" }],
    },
    {
      code: `${head}export const GET = defineHandler((c) => 1, cache({ cacheName: 'p' }));`,
      filename: "routes/a.ts",
      errors: [{ messageId: "lastArgument" }],
    },
  ],
});
