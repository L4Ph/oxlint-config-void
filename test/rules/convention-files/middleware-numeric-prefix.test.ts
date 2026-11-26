import rule from "../../../src/plugin/rules/convention-files/middleware-numeric-prefix.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("middleware-numeric-prefix", rule, {
  valid: [
    { code: "export default 1;", filename: "middleware/01.logger.ts" },
    { code: "export const x = 1;", filename: "middleware/_shared.ts" },
    { code: "export const x = 1;", filename: "lib/logger.ts" },
    // guide/server-routing.md line 217 (Global middleware): 01.logger.ts, 02.auth.ts
    { code: "export default 1;", filename: "middleware/02.auth.ts" },
    // guide/server-routing.md line 244 (basic auth): middleware/01.basic-auth.ts
    { code: "export default 1;", filename: "middleware/01.basic-auth.ts" },
  ],
  invalid: [
    {
      code: "export default 1;",
      filename: "middleware/logger.ts",
      errors: [{ messageId: "prefix" }],
    },
    {
      code: "export default 1;",
      filename: "middleware/auth.ts",
      errors: [{ messageId: "prefix" }],
    },
  ],
});
