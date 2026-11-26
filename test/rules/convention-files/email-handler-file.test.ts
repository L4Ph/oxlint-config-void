import rule from "../../../src/plugin/rules/convention-files/email-handler-file.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineEmail } from 'void/email';\n";

new RuleTester().run("email-handler-file", rule, {
  valid: [
    { code: `${IMPORT}export default defineEmail(async () => {});`, filename: "email/support.ts" },
    { code: "export const x = 1;", filename: "lib/mail.ts" },
    { code: "export const x = 1;", filename: "email/_helpers/parse.ts" },
    { code: "export const x = 1;", filename: "email/_shared.ts" },
    { code: "export const x = 1;", filename: "email/support/parse.ts" },
    // guide/email/receiving.md line 8 (Receiving Email): `_default.ts` is a handler
    {
      code: `import { defineEmail, parseEmail } from 'void/email';\n\nexport default defineEmail(async (message, env, ctx) => {\n  const parsed = await parseEmail(message);\n  await message.forward('archive@example.com');\n});`,
      filename: "email/_default.ts",
    },
    // guide/email/receiving.md line 85 (Threaded replies)
    {
      code: `import { defineEmail, parseEmail, replyEmail } from 'void/email';\n\nexport default defineEmail(async (message, env, ctx, info) => {\n  const parsed = await parseEmail(message);\n});`,
      filename: "email/support+[ticket].ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineEmail(async () => {});`,
      filename: "lib/support.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export default defineEmail(async () => {});`,
      filename: "routes/mail.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export default defineEmail(async () => {});`,
      filename: "email/support/billing.ts",
      errors: [{ messageId: "nested" }],
    },
    {
      code: `${IMPORT}export const handler = defineEmail(async () => {});`,
      filename: "email/support.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default async () => {};",
      filename: "email/support.ts",
      errors: [{ messageId: "plain" }],
    },
  ],
});
