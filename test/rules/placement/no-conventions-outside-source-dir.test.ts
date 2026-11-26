import rule from "../../../src/plugin/rules/placement/no-conventions-outside-source-dir.ts";
import { RuleTester } from "../../rule-tester.ts";

const settings = { void: { sourceDir: "src" } };

new RuleTester().run("no-conventions-outside-source-dir", rule, {
  valid: [
    { code: "export {};", filename: "src/routes/home.ts", settings },
    { code: "export default {};", filename: "vite.config.ts", settings },
    { code: "export {};", filename: "routes/home.ts" },
    { code: "export default {};", filename: "env.ts" },
    { code: "export {};", filename: "public/routes/x.ts", settings },
    // reference/config.md line 59: with sourceDir "src", Void reads src/pages, src/routes, src/auth.ts, src/env.ts
    { code: "export default {};", filename: "src/auth.ts", settings },
    { code: "export default {};", filename: "src/env.ts", settings },
    { code: "export default {};", filename: "src/pages/home.tsx", settings },
  ],
  invalid: [
    { code: "export {};", filename: "routes/home.ts", settings, errors: [{ messageId: "root" }] },
    {
      code: "export default defineEnv({});",
      filename: "env.ts",
      settings,
      errors: [{ messageId: "root" }],
    },
    { code: "export {};", filename: "db/schema.ts", settings, errors: [{ messageId: "root" }] },
  ],
});
