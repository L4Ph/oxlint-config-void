import rule from "../../../src/plugin/rules/resources/background-usage-limit-handled.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { ai } from 'void/ai';\n";

new RuleTester().run("background-usage-limit-handled", rule, {
  valid: [
    {
      code:
        head + "try { await ai.run(m, i); } catch (e) { if (!(e instanceof UsageLimit)) throw e; }",
      filename: "crons/a.ts",
    },
    { code: head + "await ai.run(m, i).catch(handle);", filename: "crons/a.ts" },
    // A request handler: Void turns the limit into a 429 itself.
    { code: head + "await ai.run(m, i);", filename: "routes/a.ts" },
    // guide/ai.md:112-125 (try/catch around ai.run, here in a queue consumer)
    {
      code:
        head +
        `export default defineQueue(async () => {
  try {
    const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [] });
    return result;
  } catch (error) {
    if (error instanceof UsageLimit) return null;
    throw error;
  }
});`,
      filename: "queues/a.ts",
    },
  ],
  invalid: [
    {
      code: head + "await ai.run(m, i);",
      filename: "queues/a.ts",
      errors: [{ messageId: "unhandled" }],
    },
    {
      code: head + "const r = await ai.run(m, i);",
      filename: "crons/a.ts",
      errors: [{ messageId: "unhandled" }],
    },
    {
      code: head + "try { x(); } catch (e) { await ai.toMarkdown(f); }",
      filename: "crons/a.ts",
      errors: [{ messageId: "unhandled" }],
    },
  ],
});
