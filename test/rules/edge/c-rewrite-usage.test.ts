import rule from "../../../src/plugin/rules/edge/c-rewrite-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const middleware = (body: string) =>
  `import { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { ${body} });`;
const handler = (body: string) =>
  `import { defineHandler } from 'void';\nexport const GET = defineHandler((c) => { ${body} });`;

new RuleTester().run("c-rewrite-usage", rule, {
  valid: [
    {
      code: middleware("if (c.req.path === '/a') return c.rewrite('/b'); await next();"),
      filename: "middleware/rewrite.ts",
    },
    { code: middleware("return next();"), filename: "middleware/rewrite.ts" },
    {
      code: middleware("if (c.isRewritten()) return next(); return c.rewrite('/b');"),
      filename: "middleware/rewrite.ts",
    },
    {
      code: middleware("if (c.req.path !== '/a') return next(); return c.rewrite('/b');"),
      filename: "middleware/rewrite.ts",
    },
    // A guard kept in a helper that is handed the context.
    {
      code: middleware("if (skip(c)) return next(); return c.rewrite('/b');"),
      filename: "middleware/rewrite.ts",
    },
    // A route handler runs once, so it needs no loop guard.
    { code: handler("return c.rewrite('/maintenance');"), filename: "routes/old.ts" },
    // A `c` that is not a Void handler's context.
    {
      code: "export function f(c) { c.rewrite('maintenance'); }",
      filename: "src/f.ts",
    },
    {
      // guide/edge/rewrites.md:38, the locale middleware.
      code: `import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  if (c.req.path.match(/^\\/(en|ja)(\\/|$)/)) return next();

  const locale = detectLocale(c.req);
  return c.rewrite(\`/\${locale}\${c.req.path}\`);
});`,
      filename: "middleware/locale.ts",
    },
    {
      // reference/api/rewrites.md:56, a route handler that rewrites.
      code: `import { defineHandler } from 'void';

export const GET = defineHandler((c) => {
  const locale = c.req.header('accept-language')?.startsWith('de') ? 'de' : 'en';
  return c.rewrite(\`/\${locale}\${new URL(c.req.url).pathname}\`);
});`,
      filename: "routes/home.ts",
    },
  ],
  invalid: [
    {
      code: middleware("c.rewrite('/b'); await next();"),
      filename: "middleware/rewrite.ts",
      errors: [{ messageId: "notReturned" }, { messageId: "loop" }],
    },
    {
      code: middleware("await c.rewrite('/b');"),
      filename: "middleware/rewrite.ts",
      errors: [{ messageId: "notReturned" }, { messageId: "loop" }],
    },
    {
      code: `import { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c) => c.rewrite('/b'));`,
      filename: "middleware/rewrite.ts",
      errors: [{ messageId: "loop" }],
    },
    {
      code: middleware("return c.rewrite('/maintenance');"),
      filename: "middleware/rewrite.ts",
      errors: [{ messageId: "loop" }],
    },
    {
      code: handler("return c.rewrite('maintenance');"),
      filename: "routes/old.ts",
      errors: [{ messageId: "destination" }],
    },
    {
      code: handler("return c.rewrite('//evil.dev/x');"),
      filename: "routes/old.ts",
      errors: [{ messageId: "destination" }],
    },
    {
      code: handler("c.rewrite('/b');"),
      filename: "routes/old.ts",
      errors: [{ messageId: "notReturned" }],
    },
  ],
});
