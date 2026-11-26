import rule from "../../../src/plugin/rules/resources/send-email-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { sendEmail } from 'void/email';\n";
const file = "routes/a.ts";

new RuleTester().run("send-email-options", rule, {
  valid: [
    { code: `${head}await sendEmail({ to: a, subject: 's', text: 't' });`, filename: file },
    { code: `${head}await sendEmail({ to: a, subject: 's', html: '<p>t</p>' });`, filename: file },
    {
      code: `${head}await sendEmail({ to, subject, text, headers: { 'X-Campaign': 'a' } });`,
      filename: file,
    },
    {
      code: `${head}await sendEmail({ to, subject, text, threading: { inReplyTo: id } });`,
      filename: file,
    },
    {
      code: `${head}await sendEmail({ to: ['a@x.dev'], subject, text, idempotencyKey: 'order-42' });`,
      filename: file,
    },
    // Options built elsewhere are unknown; a Unicode display name is supported.
    { code: `${head}await sendEmail({ ...base, subject });`, filename: file },
    { code: `${head}await sendEmail({ to: 'Zoë <z@x.dev>', subject, text });`, filename: file },
    // Not the sendEmail of void/email.
    { code: "await sendEmail({ subject: 's' });", filename: file },
    // guide/email/sending.md line 126: the docs' attachment example.
    {
      code: `${head}await sendEmail({
  to: 'user@example.com',
  subject: 'Your receipt',
  text: 'Receipt attached.',
  attachments: [
    { filename: 'receipt.pdf', content: pdfBytes, contentType: 'application/pdf' },
  ],
});`,
      filename: file,
    },
    // guide/email/sending.md line 143: the docs' inline image example.
    {
      code: `${head}await sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<img src="cid:logo" alt="Acme">',
  attachments: [
    {
      filename: 'logo.png',
      content: logoBytes,
      contentType: 'image/png',
      contentId: 'logo',
      disposition: 'inline',
    },
  ],
});`,
      filename: file,
    },
    // guide/email/sending.md line 108: the docs' threading example.
    {
      code: `${head}await sendEmail({
  to: ticket.from,
  subject: \`Re: \${ticket.subject}\`,
  text: 'We fixed it.',
  threading: {
    inReplyTo: ticket.messageId,
    references: \`\${ticket.references} \${ticket.messageId}\`,
  },
});`,
      filename: file,
    },
  ],
  invalid: [
    {
      code: `${head}await sendEmail({ subject: 's', text: 't' });`,
      filename: file,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${head}await sendEmail({ to: a, subject: 's' });`,
      filename: file,
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, text, headers: { From: 'a@b.c' } });`,
      filename: file,
      errors: [{ messageId: "reservedHeader" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, text, headers: { 'In-Reply-To': id } });`,
      filename: file,
      errors: [{ messageId: "threadingHeader" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, text, idempotencyKey: 'has space' });`,
      filename: file,
      errors: [{ messageId: "idempotencyKey" }],
    },
    {
      code: `${head}await sendEmail({ to: [${Array.from({ length: 51 }, (_, i) => `'a${i}@x.dev'`).join(",")}], subject, text });`,
      filename: file,
      errors: [{ messageId: "recipients" }],
    },
    {
      code: `${head}await sendEmail({ to: 'zoë@x.dev', subject, text });`,
      filename: file,
      errors: [{ messageId: "address" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, text, attachments: [{ filename: 'a', content: c, contentType: 'pdf' }] });`,
      filename: file,
      errors: [{ messageId: "contentType" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, html, attachments: [{ filename: 'a.png', content: c, contentId: 'logo' }] });`,
      filename: file,
      errors: [{ messageId: "inline" }],
    },
    {
      code: `${head}await sendEmail({ to, subject, html, attachments: [{ filename: 'a.png', content: c, disposition: 'inline' }] });`,
      filename: file,
      errors: [{ messageId: "inline" }],
    },
  ],
});
