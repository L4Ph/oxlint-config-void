import rule from "../../../src/plugin/rules/pages/loader-returns-object.ts";
import { RuleTester } from "../../rule-tester.ts";

const HANDLER = "import { defineHandler } from 'void';\n";

new RuleTester().run("loader-returns-object", rule, {
  valid: [
    {
      code: HANDLER + "export const loader = defineHandler(() => ({ posts: [] }));",
      filename: "pages/a.server.ts",
    },
    {
      code: HANDLER + "export const loader = defineHandler(async () => ({ n: 1 }));",
      filename: "pages/a.server.ts",
    },
    {
      // Not a loader: an action may return anything.
      code: HANDLER + "export const action = defineHandler(() => []);",
      filename: "pages/a.server.ts",
    },
    { code: HANDLER + "export const loader = defineHandler(() => []);", filename: "routes/a.ts" },
    {
      // guide/pages-routing/errors.md:80 returns a response, which is not judged.
      code: HANDLER + "export const loader = defineHandler((c) => c.notFound());",
      filename: "pages/products/[id].server.ts",
    },
    {
      // guide/pages-routing/loaders.md:42-46
      code: `import { defineHandler } from 'void/handler';

export const loader = defineHandler((c) => {
  c.status(503);
  c.header('Retry-After', '120');
  return { message: 'Down for maintenance' };
});`,
      filename: "pages/maintenance.server.ts",
    },
  ],
  invalid: [
    {
      code: HANDLER + "export const loader = defineHandler(() => []);",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "notObject" }],
    },
    {
      code: HANDLER + "export const loader = defineHandler(() => 'hi');",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "notObject" }],
    },
    {
      code:
        HANDLER +
        "export const loader = defineHandler((c) => { if (c) { return 1; } return { a: 1 }; });",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "notObject" }],
    },
  ],
});
