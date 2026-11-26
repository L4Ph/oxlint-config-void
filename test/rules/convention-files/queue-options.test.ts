import rule from "../../../src/plugin/rules/convention-files/queue-options.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("queue-options", rule, {
  valid: [
    { code: "export const maxRetries = 5;", filename: "queues/a.ts" },
    { code: "export const maxBatchSize = 10;", filename: "queues/a.ts" },
    { code: "export const maxConcurrency = 250;", filename: "queues/a.ts" },
    { code: "export const maxRetries = DEFAULTS.retries;", filename: "queues/_a.ts" },
    { code: "export const maxRetries = DEFAULTS.retries;", filename: "lib/a.ts" },
    // guide/queues.md line 95 (Consumer options)
    {
      code: `export const maxBatchSize = 50;\nexport const maxBatchTimeout = 10; // seconds\nexport const maxConcurrency = 2;\nexport const maxRetries = 5;\nexport const retryDelay = 30; // seconds`,
      filename: "queues/emails.ts",
    },
  ],
  invalid: [
    {
      code: "export const maxRetries = DEFAULTS.retries;",
      filename: "queues/a.ts",
      errors: [{ messageId: "literal" }],
    },
    {
      code: "export { maxBatchSize } from './_shared';",
      filename: "queues/a.ts",
      errors: [{ messageId: "literal" }],
    },
    {
      code: "export const maxConcurrency = 0;",
      filename: "queues/a.ts",
      errors: [{ messageId: "range" }],
    },
    {
      code: "export const maxConcurrency = 300;",
      filename: "queues/a.ts",
      errors: [{ messageId: "range" }],
    },
  ],
});
