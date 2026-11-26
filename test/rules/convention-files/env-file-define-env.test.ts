import rule from "../../../src/plugin/rules/convention-files/env-file-define-env.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineEnv, string } from 'void/env';\n";

new RuleTester().run("env-file-define-env", rule, {
  valid: [
    { code: `${IMPORT}export default defineEnv({ API_KEY: string() });`, filename: "env.ts" },
    { code: "export const x = 1;", filename: "lib/x.ts" },
    { code: `${IMPORT}const e = defineEnv({});\nexport default e;`, filename: "env.ts" },
    // guide/env-vars.md line 13 (Define the schema)
    {
      code: `import { defineEnv, number, string, url } from 'void/env';\n\nexport default defineEnv({\n  DATABASE_URL: url(),\n  STRIPE_KEY: string(),\n  PORT: number().default(3000),\n  VITE_API_ORIGIN: url(),\n});`,
      filename: "env.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export const env = defineEnv({ API_KEY: string() });`,
      filename: "env.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${IMPORT}export default defineEnv({});`,
      filename: "lib/env.ts",
      errors: [{ messageId: "location" }],
    },
    { code: "export default {};", filename: "env.ts", errors: [{ messageId: "plain" }] },
  ],
});
