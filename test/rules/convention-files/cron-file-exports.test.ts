import rule from "../../../src/plugin/rules/convention-files/cron-file-exports.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineScheduled } from 'void';\n";

new RuleTester().run("cron-file-exports", rule, {
  valid: [
    {
      code: `${IMPORT}export const cron = '0 0 * * *';\nexport default defineScheduled(async () => {});`,
      filename: "crons/nightly.ts",
    },
    { code: "export const x = 1;", filename: "crons/_shared.ts" },
    {
      code: "export const cron = '0 0 * * *';\nexport default async () => {};",
      filename: "crons/a.ts",
    },
    {
      code: `${IMPORT}export const cron = ['0 0 * * *', '30 6 * * 1'];\nexport default defineScheduled(async () => {});`,
      filename: "crons/b.ts",
    },
    { code: "export const x = 1;", filename: "lib/helpers.ts" },
    // guide/jobs.md line 21 (Job files): the docs' own example
    {
      code: `import { defineScheduled } from 'void';\n\nexport const cron = '0 * * * *';\n\nexport default defineScheduled(async (controller, env) => {\n  await env.KV.put('jobs:last-heartbeat', controller.scheduledTime.toString());\n});`,
      filename: "crons/hourly-heartbeat.ts",
    },
    // guide/jobs.md line 38 (Multiple schedules)
    {
      code: `import { defineScheduled } from 'void';\n\nexport const cron = ['0 * * * *', '30 * * * *'];\n\nexport default defineScheduled(async (controller, env) => {});`,
      filename: "crons/cleanup.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineScheduled(async () => {});`,
      filename: "crons/nightly.ts",
      errors: [{ messageId: "missingCron" }],
    },
    {
      code: "export const cron = '0 0 * * *';",
      filename: "crons/nightly.ts",
      errors: [{ messageId: "missingDefault" }],
    },
    {
      code: `${IMPORT}export const cron = 5;\nexport default defineScheduled(async () => {});`,
      filename: "crons/a.ts",
      errors: [{ messageId: "notCron" }],
    },
  ],
});
