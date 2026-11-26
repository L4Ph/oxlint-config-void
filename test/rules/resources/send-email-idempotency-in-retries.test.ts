import rule from "../../../src/plugin/rules/resources/send-email-idempotency-in-retries.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { sendEmail } from 'void/email';\n";

new RuleTester().run("send-email-idempotency-in-retries", rule, {
  valid: [
    {
      code: `${head}await sendEmail({ to, subject, text, idempotencyKey: msg.id });`,
      filename: "queues/a.ts",
    },
    // A route is not retried: not governed.
    { code: `${head}await sendEmail({ to, subject, text });`, filename: "routes/a.ts" },
    { code: `${head}await sendEmail({ to, subject, text });`, filename: "queues/_mail.ts" },
    // Options built elsewhere are unknown.
    { code: `${head}await sendEmail({ ...base, to });`, filename: "crons/a.ts" },
    // guide/email/sending.md line 172: the docs' own example.
    {
      code: `${head}const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Invoice ready',
  text: 'Your invoice is available in your account.',
  idempotencyKey: 'invoice:42:ready',
});`,
      filename: "queues/invoices.ts",
    },
  ],
  invalid: [
    {
      code: `${head}await sendEmail({ to, subject, text });`,
      filename: "queues/a.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, html });`,
      filename: "crons/a.ts",
      errors: [{ messageId: "missing" }],
    },
  ],
});
