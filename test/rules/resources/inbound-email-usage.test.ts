import rule from "../../../src/plugin/rules/resources/inbound-email-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { parseEmail, replyEmail, sendEmail } from 'void/email';\n";

new RuleTester().run("inbound-email-usage", rule, {
  valid: [
    { code: head + "await replyEmail(message, { text });", filename: "email/a.ts" },
    {
      code: head + "await sendEmail({ to, subject, text, threading });",
      filename: "routes/a.ts",
    },
    { code: "await message.forward('ops@x.dev');", filename: "email/a.ts" },
    { code: "await message.reply({ to: 'a@x.dev', text });", filename: "email/a.ts" },
    { code: head + "const parsed = await parseEmail(message);", filename: "email/a.ts" },
    // Different branches read the stream once each.
    {
      code: head + "if (a) { await parseEmail(m); } else { await parseEmail(m); }",
      filename: "email/a.ts",
    },
    // Outside email/, forward is not a message method of ours.
    { code: "router.forward('Ops <ops@x.dev>');", filename: "routes/a.ts" },
    // guide/email/receiving.md:20-23 and :70-76
    {
      code:
        head +
        `export default defineEmail(async (message, env, ctx, info) => {
  const parsed = await parseEmail(message);
  await ticketStore.append(info!.params.ticket, parsed.text ?? '');
  await replyEmail(message, { text: \`Got your message on ticket \${info!.params.ticket}.\` });
  await message.forward('archive@example.com');
});`,
      filename: "email/support+[ticket].ts",
    },
  ],
  invalid: [
    {
      code: head + "await replyEmail(message, { text });",
      filename: "routes/a.ts",
      errors: [{ messageId: "replyOutside" }],
    },
    {
      code: head + "await replyEmail(m, {});",
      filename: "queues/a.ts",
      errors: [{ messageId: "replyOutside" }],
    },
    {
      code: "await message.forward('Ops <ops@x.dev>');",
      filename: "email/a.ts",
      errors: [{ messageId: "displayName" }],
    },
    {
      code: "await message.reply({ to: 'Ann <a@x.dev>', text });",
      filename: "email/a.ts",
      errors: [{ messageId: "displayName" }],
    },
    {
      code: head + "await parseEmail(message);\nawait parseEmail(message);",
      filename: "email/a.ts",
      errors: [{ messageId: "parsedTwice" }],
    },
  ],
});
