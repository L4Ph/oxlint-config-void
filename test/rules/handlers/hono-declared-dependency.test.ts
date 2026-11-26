import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/handlers/hono-declared-dependency.ts";
import { RuleTester } from "../../rule-tester.ts";

const fixture = (path: string) => fileURLToPath(new URL(`./fixtures/${path}`, import.meta.url));

new RuleTester().run("hono-declared-dependency", rule, {
  valid: [
    {
      code: "import { cache } from 'hono/cache';",
      filename: fixture("with-hono/routes/a.ts"),
    },
    {
      code: "import { zValidator } from '@hono/zod-validator';",
      filename: fixture("with-hono/routes/a.ts"),
    },
    // A file that imports nothing from Hono is not governed, whatever its package.json says.
    {
      code: "import { defineHandler } from 'void';",
      filename: fixture("without-hono/routes/a.ts"),
    },
    {
      // integrations/hono.md:21-25 (a middleware file importing hono/cors in an app that has hono).
      code: "import { cors } from 'hono/cors';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(cors({ origin: 'https://example.com' }));",
      filename: fixture("with-hono/middleware/01.cors.ts"),
    },
  ],
  invalid: [
    {
      code: "import { cache } from 'hono/cache';",
      filename: fixture("without-hono/routes/a.ts"),
      errors: [{ messageId: "undeclared" }],
    },
    {
      code: "import { zValidator } from '@hono/zod-validator';",
      filename: fixture("without-hono/routes/a.ts"),
      errors: [{ messageId: "undeclared" }],
    },
    {
      code: "const m = await import('hono/cors');",
      filename: fixture("without-hono/routes/a.ts"),
      errors: [{ messageId: "undeclared" }],
    },
  ],
});
