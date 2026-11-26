import rule from "../../../src/plugin/rules/resources/no-computed-env-binding.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-computed-env-binding", rule, {
  valid: [
    { code: "const { DB, KV: cache } = c.env;", filename: "routes/a.ts" },
    { code: "const v = c.env['KV'];", filename: "routes/a.ts" },
    { code: "const all = { ...c.env };", filename: "routes/a.ts" },
    { code: "const v = c.env[name];", filename: "lib/a.ts" },
    { code: "const v = process.env[name];", filename: "routes/a.ts" },
    { code: "import { env } from 'void/env';\nconst v = env[name];", filename: "routes/a.ts" },
    // reference/resource-inference.md:25-27
    { code: "const { DB, KV: cache } = c.env;\nconst k = c.env['KV'];", filename: "crons/a.ts" },
  ],
  invalid: [
    {
      code: "const v = c.env[name];",
      filename: "routes/a.ts",
      errors: [{ messageId: "computed" }],
    },
    {
      code: "export default defineQueue(async (b, env) => { return env[`Q_${n}`]; });",
      filename: "queues/a.ts",
      errors: [{ messageId: "computed" }],
    },
    {
      code: "const v = c.env[name];",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "computed" }],
    },
  ],
});
