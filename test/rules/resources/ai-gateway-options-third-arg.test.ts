import rule from "../../../src/plugin/rules/resources/ai-gateway-options-third-arg.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { ai } from 'void/ai';\n";

new RuleTester().run("ai-gateway-options-third-arg", rule, {
  valid: [
    {
      code: head + "await ai.run(m, inputs, { gateway: { skipCache: true } });",
      filename: "routes/a.ts",
    },
    { code: head + "await ai.run(m, inputs);", filename: "routes/a.ts" },
    // A `gateway` input of some other `ai` object is not ours.
    {
      code: "const ai = x;\nawait ai.run(m, { gateway: {} });",
      filename: "routes/a.ts",
    },
    // guide/ai.md:144 (gateway as the third argument)
    {
      code: head + "ai.run('google/gemini-2.5-flash', inputs, { gateway: { skipCache: true } });",
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: head + "await ai.run(m, { prompt: 'a', gateway: { skipCache: true } });",
      filename: "routes/a.ts",
      errors: [{ messageId: "gateway" }],
    },
    {
      code: head + "await ai.run(m, { gateway: {} });",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "gateway" }],
    },
  ],
});
