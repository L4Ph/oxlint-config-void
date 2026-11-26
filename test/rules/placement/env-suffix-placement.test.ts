import rule from "../../../src/plugin/rules/placement/env-suffix-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("env-suffix-placement", rule, {
  valid: [
    { code: "export default 1;", filename: "middleware/01.logger.ts" },
    { code: "export const cron = '0 0 * * *';", filename: "crons/nightly.ts" },
    { code: "export {};", filename: "pages/chart.dev.island.tsx" },
    { code: "export default 1;", filename: "routes/chat.dev.ws.ts" },
    { code: "export default 1;", filename: "pages/layout.tsx" },
    { code: "export {};", filename: "pages/home.dev.server.ts" },
    { code: "export {};", filename: "middleware/_helpers.dev.ts" },
    // guide/server-routing.md line 35 (Environment-only routes)
    { code: "export const GET = 1;", filename: "routes/api/debug.dev.ts" },
    { code: "export const GET = 1;", filename: "routes/api/metrics.prod.ts" },
    { code: "export default 1;", filename: "routes/preview.dev.tsx" },
    // guide/pages-routing/overview.md line 112 (Environment-only pages)
    { code: "export default 1;", filename: "pages/stats.prod.tsx" },
  ],
  invalid: [
    {
      code: "export default 1;",
      filename: "middleware/01.logger.dev.ts",
      errors: [{ messageId: "directory" }],
    },
    {
      code: "export default 1;",
      filename: "queues/emails.prod.ts",
      errors: [{ messageId: "directory" }],
    },
    {
      code: "export {};",
      filename: "pages/chart.island.dev.tsx",
      errors: [{ messageId: "order" }],
    },
    {
      code: "export default 1;",
      filename: "routes/chat.ws.prod.ts",
      errors: [{ messageId: "order" }],
    },
    {
      code: "export default 1;",
      filename: "pages/layout.dev.tsx",
      errors: [{ messageId: "layout" }],
    },
  ],
});
