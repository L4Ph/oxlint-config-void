import rule from "../../../src/plugin/rules/convention-files/define-auth-spread-defaults.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineAuth } from 'void/auth';\n";

new RuleTester().run("define-auth-spread-defaults", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => ({ ...defaults, plugins: [] }));`,
      filename: "auth.ts",
    },
    {
      code: `${IMPORT}export default defineAuth((ctx) => ({ ...ctx.defaults }));`,
      filename: "auth.ts",
    },
    { code: "export default () => ({ plugins: [] });", filename: "lib/other.ts" },
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => {\n  return { ...defaults };\n});`,
      filename: "auth.ts",
    },
    // reference/api/auth.md line 14 (defineAuth)
    {
      code: `import { defineAuth } from 'void/auth';\n\nexport default defineAuth(({ defaults }) => ({\n  ...defaults,\n  trustedOrigins: ['https://example.com'],\n}));`,
      filename: "auth.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineAuth(() => ({ plugins: [] }));`,
      filename: "auth.ts",
      errors: [{ messageId: "spread" }],
    },
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => ({ plugins: [] }));`,
      filename: "auth.ts",
      errors: [{ messageId: "spread" }],
    },
    {
      code: `${IMPORT}export default defineAuth(({ defaults }) => {\n  return { plugins: [] };\n});`,
      filename: "auth.ts",
      errors: [{ messageId: "spread" }],
    },
  ],
});
