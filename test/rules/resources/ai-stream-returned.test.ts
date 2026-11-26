import rule from "../../../src/plugin/rules/resources/ai-stream-returned.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { ai } from 'void/ai';\n";

new RuleTester().run("ai-stream-returned", rule, {
  valid: [
    { code: head + "return ai.stream(model, input);", filename: "routes/a.ts" },
    {
      code: head + "export const POST = defineHandler((c) => ai.stream(m, i));",
      filename: "routes/a.ts",
    },
    { code: head + "const s = ai.stream(m, i);\nreturn s;", filename: "routes/a.ts" },
    // Not a route file.
    { code: head + "return c.json(await ai.stream(m, i));", filename: "pages/a.server.ts" },
    // guide/ai.md:63-71
    {
      code:
        head +
        `export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();
  return ai.stream('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: prompt }],
  });
});`,
      filename: "routes/chat.ts",
    },
  ],
  invalid: [
    {
      code: head + "return c.json(await ai.stream(model, input));",
      filename: "routes/a.ts",
      errors: [{ messageId: "serialised" }],
    },
    {
      code: head + "const s = ai.stream(model, input);\nreturn c.text('ok');",
      filename: "routes/a.ts",
      errors: [{ messageId: "dropped" }],
    },
    {
      code: head + "return new Response(JSON.stringify(ai.stream(m, i)));",
      filename: "routes/a.ts",
      errors: [{ messageId: "serialised" }],
    },
  ],
});
