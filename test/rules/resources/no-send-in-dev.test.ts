import rule from "../../../src/plugin/rules/resources/no-send-in-dev.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-send-in-dev", rule, {
  valid: [
    {
      code: "export default defineConfig({ email: { from: 'a@x.dev' } });",
      filename: "void.config.ts",
    },
    { code: "await sendEmail({ to, subject, text });", filename: "routes/a.ts" },
    // A file with no object literal at all.
    { code: "export {};", filename: "pages/about.tsx" },
    // A destructuring pattern is not a setting.
    { code: "const { sendInDev } = options;", filename: "routes/a.ts" },
    // guide/email/sending.md line 230 asks to remove the option; the page's sends omit it.
    {
      code: "await sendEmail({ to: 'user@example.com', subject: 'Hello', text: 'Hi' });",
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ email: { from: 'a@x.dev', sendInDev: true } });",
      filename: "void.config.ts",
      errors: [{ messageId: "removed" }],
    },
    {
      code: "await sendEmail({ to, subject, text, sendInDev: true });",
      filename: "routes/a.ts",
      errors: [{ messageId: "removed" }],
    },
  ],
});
