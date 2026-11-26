import rule from "../../../src/plugin/rules/resources/logging-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { logger } from 'void/log';\n";

new RuleTester().run("logging-usage", rule, {
  valid: [
    { code: head + "logger.info('started');", filename: "routes/a.ts" },
    { code: head + "const l = logger.child({ job: 'a' });", filename: "routes/a.ts" },
    {
      code: "try { x(); } catch (error) { console.error('Save failed:', error); }",
      filename: "routes/a.ts",
    },
    {
      code: head + "try { x(); } catch (e) { logger.error('failed', { e }); }",
      filename: "routes/a.ts",
    },
    // A different logger.
    { code: "logger.debug('x');", filename: "routes/a.ts" },
    // reference/api/resources.md:131-138
    {
      code:
        head +
        `logger.info('checkout completed', { orderId, userId });
logger.error('webhook failed', { provider: 'stripe', attempt: 3 });
const log = logger.child({ component: 'queue', queue: 'tasks' });
log.info('task.started', { taskId });`,
      filename: "queues/a.ts",
    },
  ],
  invalid: [
    {
      code: head + "logger.debug('x');",
      filename: "routes/a.ts",
      errors: [{ messageId: "method" }],
    },
    { code: head + "logger.log('x');", filename: "routes/a.ts", errors: [{ messageId: "method" }] },
    {
      code: "try { x(); } catch (error) { console.error('Save failed:', error.message); }",
      filename: "routes/a.ts",
      errors: [{ messageId: "messageOnly" }],
    },
    {
      code: head + "try { x(); } catch (e) { logger.error(e.message); }",
      filename: "routes/a.ts",
      errors: [{ messageId: "messageOnly" }],
    },
  ],
});
