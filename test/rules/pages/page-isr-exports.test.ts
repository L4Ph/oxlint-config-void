import rule from "../../../src/plugin/rules/pages/page-isr-exports.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("page-isr-exports", rule, {
  valid: [
    { code: "export const prerender = true;", filename: "pages/a.server.ts" },
    { code: "export const ssr = false;", filename: "pages/a.server.ts" },
    { code: "export const revalidate = 3600;", filename: "pages/a.server.ts" },
    { code: "export const revalidate = 0;", filename: "pages/a.server.ts" },
    {
      code: "export const prerender = true;\nexport const revalidate = 60;",
      filename: "pages/a.server.ts",
    },
    {
      // Not a .server file: another rule reports the export.
      code: "export const prerender = process.env.PRERENDER === '1';",
      filename: "pages/a.tsx",
    },
    {
      // guide/edge/revalidation.md:54-62
      code: `export const revalidate = 120; // cache for 2 minutes

export const loader = defineHandler(async (c) => {
  // ...
});`,
      filename: "pages/products/index.server.ts",
    },
    {
      // guide/pages-routing/overview.md:133-141
      code: `import { defineHandler } from 'void';

export const ssr = false;

export const loader = defineHandler(async () => {
  return { title: 'Dashboard' };
});`,
      filename: "pages/dashboard.server.ts",
    },
  ],
  invalid: [
    {
      code: "export const prerender = process.env.PRERENDER === '1';",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "boolean" }],
    },
    {
      code: "const on = true;\nexport const ssr = on;",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "boolean" }],
    },
    {
      code: "export const revalidate = 60 * 60;",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "wholeNumber" }],
    },
    {
      code: "export { revalidate } from './_cfg';",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "reexport" }],
    },
    {
      code: "export const prerender = true;\nexport const revalidate = 0;",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "zero" }],
    },
    {
      code: "export const prerender = 'yes';",
      filename: "src/main.ssr.ts",
      errors: [{ messageId: "boolean" }],
    },
  ],
});
