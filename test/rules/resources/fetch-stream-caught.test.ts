import rule from "../../../src/plugin/rules/resources/fetch-stream-caught.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { fetchStream } from 'void/client';\n";

new RuleTester().run("fetch-stream-caught", rule, {
  valid: [
    {
      code:
        head +
        "try { for await (const c of fetchStream('/chat', {})) add(c); } catch (e) { retry(); }",
      filename: "pages/chat.tsx",
    },
    { code: head + "fetchStream('/chat').catch(handle);", filename: "pages/chat.tsx" },
    // Server code does not run in the UI.
    { code: head + "for await (const c of fetchStream('/x')) add(c);", filename: "routes/a.ts" },
    // Iterated inside a try block.
    {
      code:
        head +
        "const s = fetchStream('/chat');\ntry { for await (const c of s) add(c); } catch (e) { retry(); }",
      filename: "pages/chat.tsx",
    },
    // guide/ai.md:74 (catch the error in the UI), with `instanceof UsageLimit` from guide/ai.md:127.
    {
      code:
        head +
        "async function send() { try { for await (const chunk of fetchStream('/chat')) add(chunk); } catch (error) { if (error instanceof UsageLimit) show(error.message); } }",
      filename: "pages/_features/chat.tsx",
    },
  ],
  invalid: [
    {
      code: head + "for await (const c of fetchStream('/chat', {})) add(c);",
      filename: "pages/chat.tsx",
      errors: [{ messageId: "uncaught" }],
    },
    {
      code: head + "const s = fetchStream('/chat');",
      filename: "pages/chat.tsx",
      errors: [{ messageId: "uncaught" }],
    },
    {
      code: head + "const s = fetchStream('/chat');\nfor await (const c of s) add(c);",
      filename: "pages/chat.tsx",
      errors: [{ messageId: "uncaught" }],
    },
  ],
});
