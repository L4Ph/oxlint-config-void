import rule from "../../../src/plugin/rules/edge/revalidate-header-value.ts";
import { RuleTester } from "../../rule-tester.ts";

const handler = "import { defineHandler } from 'void';\n";
const route = (body: string) => `${handler}export const GET = defineHandler((c) => { ${body} });`;

new RuleTester().run("revalidate-header-value", rule, {
  valid: [
    { code: route("c.header('x-revalidate', '60');"), filename: "routes/feed.ts" },
    { code: route("c.header('x-revalidate', String(ttl));"), filename: "routes/feed.ts" },
    { code: route("c.header('x-revalidate', '0');"), filename: "routes/feed.ts" },
    // A context that is not a Void handler's.
    {
      code: "export const GET = (c) => { c.header('x-revalidate', 60); };",
      filename: "routes/feed.ts",
    },
    // Not a file of routes/, pages/ companions or middleware/.
    { code: route("c.header('x-revalidate', 60);"), filename: "src/feed.ts" },
    {
      // guide/edge/revalidation.md:90, the per-response TTL override.
      code: `export const GET = defineHandler(async (c) => {
  // Don't cache this particular response
  c.header('x-revalidate', '0');

  return c.html('...');
});`.replace("export const", `${handler}export const`),
      filename: "routes/page.ts",
    },
  ],
  invalid: [
    {
      code: route("c.header('x-revalidate', 60);"),
      filename: "routes/feed.ts",
      errors: [{ messageId: "number" }],
    },
    {
      code: route("c.header('x-revalidate', '1h');"),
      filename: "routes/feed.ts",
      errors: [{ messageId: "value" }],
    },
    {
      code: `import { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { c.header('X-Revalidate', '1.5'); await next(); });`,
      filename: "middleware/ttl.ts",
      errors: [{ messageId: "value" }],
    },
  ],
});
