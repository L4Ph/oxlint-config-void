import rule from "../../../src/plugin/rules/convention-files/auth-file-define-auth.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineAuth } from 'void/auth';\n";

new RuleTester().run("auth-file-define-auth", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => ({ ...defaults }));`,
      filename: "auth.ts",
    },
    { code: "export const x = 1;", filename: "lib/session.ts" },
    {
      code: `${IMPORT}const a = defineAuth(() => ({}));\nexport default a;`,
      filename: "auth.ts",
    },
    // guide/auth.md line 235 (Customization)
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => ({\n  ...defaults,\n  trustedOrigins: ['https://example.com'],\n}));`,
      filename: "auth.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => ({ ...defaults }));`,
      filename: "lib/auth.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export default defineAuth(() => ({}));`,
      filename: "server/auth.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export const auth = defineAuth(() => ({}));`,
      filename: "auth.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default { plugins: [] };",
      filename: "auth.ts",
      errors: [{ messageId: "plain" }],
    },
  ],
});
