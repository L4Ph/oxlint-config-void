import rule from "../../../src/plugin/rules/placement/queue-file-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineQueue } from 'void';\n";
const QUEUE = `${IMPORT}export default defineQueue<Msg>(async (batch) => {});`;

new RuleTester().run("queue-file-placement", rule, {
  valid: [
    { code: QUEUE, filename: "queues/emails.ts" },
    { code: "export const x = 1;", filename: "lib/helpers.ts" },
    { code: QUEUE, filename: "queues/send-welcome.ts" },
    { code: QUEUE, filename: "queues/billing/retry.ts" },
    { code: QUEUE, filename: "queues/_shared/send_welcome.ts" },
    // guide/queues.md line 12 (Defining queues): `queues/emails.ts` creates `emails`, `queues/order/notifications.ts` creates `order-notifications`
    { code: QUEUE, filename: "queues/order/notifications.ts" },
  ],
  invalid: [
    { code: QUEUE, filename: "lib/emails.ts", errors: [{ messageId: "outside" }] },
    { code: QUEUE, filename: "queues/emails.tsx", errors: [{ messageId: "extension" }] },
    { code: QUEUE, filename: "queues/send_welcome.ts", errors: [{ messageId: "name" }] },
    { code: QUEUE, filename: "queues/-bad.ts", errors: [{ messageId: "name" }] },
  ],
});
