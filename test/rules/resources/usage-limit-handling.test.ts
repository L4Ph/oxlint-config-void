import rule from "../../../src/plugin/rules/resources/usage-limit-handling.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { UsageLimit } from 'void/limits';\n";

new RuleTester().run("usage-limit-handling", rule, {
  valid: [
    {
      code: `${head}try { await ai.run(m, i); } catch (e) { if (e instanceof UsageLimit) return e.response({ message: 'busy' }); throw e; }`,
      filename: "routes/a.ts",
    },
    { code: "import { UsageLimit } from 'void/limits';", filename: "routes/a.ts" },
    // Browser code may end its catch without a rethrow; a different error name is not a limit.
    {
      code: `${head}try { await run(); } catch (e) { if (e instanceof UsageLimit) show(e.message); else fail(); }`,
      filename: "pages/chat.tsx",
    },
    {
      code: "try { run(); } catch (e) { if (e.name === 'AbortError') return; throw e; }",
      filename: "routes/a.ts",
    },
    // guide/ai.md line 109: the docs' own example.
    {
      code: `import { defineHandler } from 'void';
import { ai } from 'void/ai';
import { UsageLimit } from 'void/limits';

export const POST = defineHandler(async (c) => {
  const { prompt } = await c.req.json();
  try {
    const result = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
    });
    return c.json(result);
  } catch (error) {
    if (error instanceof UsageLimit) {
      return error.response({ message: 'Try again shortly. Your prompt has been kept.' });
    }
    throw error;
  }
});`,
      filename: "routes/chat.ts",
    },
  ],
  invalid: [
    {
      code: "import { UsageLimit } from './limits';",
      filename: "routes/a.ts",
      errors: [{ messageId: "source" }],
    },
    {
      code: "try { await ai.run(m, i); } catch (e) { if (e.name === 'UsageLimit') return null; }",
      filename: "routes/a.ts",
      errors: [{ messageId: "byName" }],
    },
    {
      code: "try { await ai.run(m, i); } catch (e) { if (e.message.includes('usage limit')) return null; throw e; }",
      filename: "queues/a.ts",
      errors: [{ messageId: "byName" }],
    },
    {
      code: `${head}try { await ai.run(m, i); } catch (e) { if (e instanceof UsageLimit) return e.response({ message: 'busy' }); return null; }`,
      filename: "routes/a.ts",
      errors: [{ messageId: "rethrow" }],
    },
  ],
});
