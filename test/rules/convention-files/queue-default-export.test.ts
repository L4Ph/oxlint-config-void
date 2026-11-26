import rule from "../../../src/plugin/rules/convention-files/queue-default-export.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineQueue } from 'void';\n";

new RuleTester().run("queue-default-export", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineQueue<Msg>(async (batch) => {});`,
      filename: "queues/emails.ts",
    },
    { code: "export const x = 1;", filename: "queues/_helpers.ts" },
    {
      code: `${IMPORT}export default defineQueue(async (batch: QueueBatch<Msg>) => {});`,
      filename: "queues/emails.ts",
    },
    { code: "export const x = 1;", filename: "lib/queue.ts" },
    {
      code: `${IMPORT}export default defineQueue(async (batch) => {});`,
      filename: "queues/emails.js",
    },
    // guide/queues.md line 27 (Defining queues)
    {
      code: `import { defineQueue } from 'void';\n\ninterface Message {\n  to: string;\n  subject: string;\n}\n\nexport default defineQueue<Message>(async (batch, env) => {\n  for (const msg of batch.messages) {\n    console.log(\`Send to \${msg.body.to}: \${msg.body.subject}\`);\n    msg.ack();\n  }\n});`,
      filename: "queues/emails.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export const handler = defineQueue<Msg>(async () => {});`,
      filename: "queues/emails.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default async () => {};",
      filename: "queues/emails.ts",
      errors: [{ messageId: "plain" }],
    },
    {
      code: `${IMPORT}export default defineQueue(async (batch) => {});`,
      filename: "queues/emails.ts",
      errors: [{ messageId: "typeArgument" }],
    },
    {
      code: `${IMPORT}export default defineQueue(async () => {});`,
      filename: "queues/audit.ts",
      errors: [{ messageId: "typeArgument" }],
    },
  ],
});
