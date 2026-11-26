import rule from "../../../src/plugin/rules/resources/queue-no-swallowed-error.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineQueue } from 'void';\n";

new RuleTester().run("queue-no-swallowed-error", rule, {
  valid: [
    {
      code: `${head}export default defineQueue<M>(async (b) => { try { await go(); } catch (e) { msg.retry(); } });`,
      filename: "queues/a.ts",
    },
    {
      code: `${head}export default defineQueue<M>(async (b) => { await go(); });`,
      filename: "queues/a.ts",
    },
    // A file the rule does not govern.
    {
      code: `${head}export default defineQueue<M>(async (b) => { try { await go(); } catch (e) { log(e); } });`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}export default defineQueue<M>(async (b) => { try { await go(); } catch (e) { log(e); } });`,
      filename: "queues/_helper.ts",
    },
    // guide/queues.md line 60: the docs' own example.
    {
      code: `${head}export default defineQueue<Message>(async (batch, env) => {
  for (const msg of batch.messages) {
    try {
      await processMessage(msg.body);
      msg.ack();
    } catch {
      msg.retry({ delaySeconds: 30 });
    }
  }
});`,
      filename: "queues/emails.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export default defineQueue<M>(async (b) => { try { await go(); } catch (e) { log(e); } });`,
      filename: "queues/a.ts",
      errors: [{ messageId: "swallowed" }],
    },
    {
      code: `${head}export default defineQueue<M>(async (b) => { try { await go(); } catch {} });`,
      filename: "queues/a.ts",
      errors: [{ messageId: "swallowed" }],
    },
  ],
});
