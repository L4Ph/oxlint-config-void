import rule from "../../../src/plugin/rules/placement/cron-file-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineScheduled } from 'void';\n";
const JOB = `${IMPORT}export const cron = '0 0 * * *';\nexport default defineScheduled(async () => {});`;

new RuleTester().run("cron-file-placement", rule, {
  valid: [
    { code: JOB, filename: "crons/nightly.ts" },
    { code: "export const nightly = '0 0 * * *';", filename: "lib/schedule.ts" },
    {
      code: `${IMPORT}export const handler = defineScheduled(async () => {});`,
      filename: "lib/handlers.ts",
    },
    { code: JOB, filename: "crons/_shared/nightly.ts" },
    { code: JOB, filename: "crons/nightly.mjs" },
    // guide/jobs.md line 21 (Job files)
    {
      code: `import { defineScheduled } from 'void';\n\nexport const cron = '0 * * * *';\n\nexport default defineScheduled(async (controller, env) => {\n  await env.KV.put('jobs:last-heartbeat', controller.scheduledTime.toString());\n});`,
      filename: "crons/hourly-heartbeat.ts",
    },
  ],
  invalid: [
    { code: JOB, filename: "lib/nightly.ts", errors: [{ messageId: "outside" }] },
    {
      code: `${IMPORT}export default defineScheduled(async () => {});`,
      filename: "jobs/nightly.ts",
      errors: [{ messageId: "outside" }],
    },
    { code: JOB, filename: "crons/nightly.tsx", errors: [{ messageId: "extension" }] },
  ],
});
