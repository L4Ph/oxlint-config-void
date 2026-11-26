import rule from "../../../src/plugin/rules/resources/send-email-result-checked.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { sendEmail } from 'void/email';\n";
const file = "routes/a.ts";

new RuleTester().run("send-email-result-checked", rule, {
  valid: [
    {
      code: `${head}const r = await sendEmail(m);\nif (!r.ok) log(r.error, r.deliveries);`,
      filename: file,
    },
    { code: `${head}return await sendEmail(m);`, filename: file },
    // The result goes elsewhere: not judged.
    { code: `${head}const r = await sendEmail(m);\nif (!r.ok) report(r);`, filename: file },
    // Not the sendEmail of void/email.
    { code: "await sendEmail(m);", filename: file },
    // guide/email/sending.md line 13: the docs' own example.
    {
      code: `${head}const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  text: 'Thanks for signing up.',
});
if (!result.ok) {
  if ('error' in result) {
    console.error(result.error.code, result.error.message);
  } else {
    for (const d of result.deliveries.filter((d) => !d.ok)) {
      console.error(d.recipient, d.error.code, d.error.message);
    }
  }
}`,
      filename: file,
    },
    // guide/email/sending.md line 172: the docs' idempotency example passes the whole result on.
    {
      code: `${head}const result = await sendEmail({ to: 'user@example.com', subject: 'Invoice ready', text: 'x', idempotencyKey: 'invoice:42:ready' });
if (result.ok) {
  console.log('Accepted by the provider', result.operationId);
} else {
  console.log('Inspect the outcome before retrying', result.operationId, result);
}`,
      filename: file,
    },
  ],
  invalid: [
    { code: `${head}await sendEmail(m);`, filename: file, errors: [{ messageId: "discarded" }] },
    {
      code: `${head}try { await sendEmail(m); } catch (e) { log(e); }`,
      filename: file,
      errors: [{ messageId: "caught" }],
    },
    {
      code: `${head}const r = await sendEmail(m);\nif (!r.ok) throw new Error(r.error.message);`,
      filename: file,
      errors: [{ messageId: "bothShapes" }],
    },
  ],
});
