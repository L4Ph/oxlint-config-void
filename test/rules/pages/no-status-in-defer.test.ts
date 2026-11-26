import rule from "../../../src/plugin/rules/pages/no-status-in-defer.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineHandler, defer } from 'void';\n";

new RuleTester().run("no-status-in-defer", rule, {
  valid: [
    {
      code:
        IMPORT +
        "export const loader = defineHandler((c) => { if (!ok) c.status(404); return { slow: defer(async () => 1) }; });",
      filename: "pages/a.server.ts",
    },
    {
      code:
        IMPORT +
        "export const loader = defineHandler(() => ({ slow: defer(async () => { throw new HTTPException(500); }) }));",
      filename: "pages/a.server.ts",
    },
    {
      code:
        IMPORT +
        "export const loader = defineHandler((c) => ({ slow: defer(async () => { c.status(404); return 1; }) }));",
      filename: "routes/a.ts",
    },
    {
      // guide/pages-routing/loaders.md:137-145
      code: `import { defineHandler, defer } from 'void';
import { db } from 'void/db';

export const loader = defineHandler(async (c) => {
  const allProjects = await db.select().from(projects); // fast, returns immediately
  return {
    projects: allProjects,
    usage: defer(async () => {
      return await fetchUsageMetrics(); // slow, streams when ready
    }),
  };
});`,
      filename: "pages/dashboard.server.ts",
    },
  ],
  invalid: [
    {
      code:
        IMPORT +
        "export const loader = defineHandler((c) => ({ slow: defer(async () => { c.status(404); return 1; }) }));",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "status" }],
    },
    {
      code:
        IMPORT +
        "export const loader = defineHandler((c) => ({ slow: defer(async () => { throw c.redirect('/x'); }) }));",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "status" }],
    },
  ],
});
