import rule from "../../../src/plugin/rules/config/email-from-format.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("email-from-format", rule, {
  valid: [
    {
      code: "export default defineConfig({ email: { from: 'Acme <noreply@mail.acme.com>' } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ email: { from: 'noreply@mail.acme.com' } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ email: { from: '\"Acme, Inc.\" <noreply@mail.acme.com>' } });",
      filename: "void.config.ts",
    },
    // A value computed elsewhere is not judged.
    {
      code: "export default defineConfig({ email: { from: process.env.FROM } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default { email: { from: 'noreply' } };", filename: "mail.config.ts" },
    {
      // reference/config.md:173, the email example.
      code: `export default defineConfig({
  email: {
    from: 'Acme <noreply@mail.acme.com>',
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ email: { from: 'noreply' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "from" }],
    },
    {
      code: "export default defineConfig({ email: { from: 'a@x.dev, b@x.dev' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "from" }],
    },
  ],
});
