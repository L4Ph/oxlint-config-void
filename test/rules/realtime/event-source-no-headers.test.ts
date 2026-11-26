import rule from "../../../src/plugin/rules/realtime/event-source-no-headers.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { connectEventStream } from 'void/sse/client';\n";

new RuleTester().run("event-source-no-headers", rule, {
  valid: [
    {
      code: `${head}connectEventStream('/feed', { withCredentials: true });`,
      filename: "pages/feed.tsx",
    },
    { code: `${head}connectEventStream('/feed');`, filename: "pages/feed.tsx" },
    // another function of the same name
    {
      code: "connectEventStream('/feed', { headers: { a: 1 } });",
      filename: "pages/feed.tsx",
    },
    {
      code: `${head}connectEventStream('/api/logs', { parse: 'text' });`,
      filename: "pages/_lib/logs.ts",
    },
    // guide/sse.md:124
    {
      code: `${head}const stream = connectEventStream<{ ready: { now: number } }>('/api/events', { withCredentials: true });`,
      filename: "pages/_lib/events.ts",
    },
  ],
  invalid: [
    {
      code: `${head}connectEventStream('/feed', { headers: { Authorization: t } });`,
      filename: "pages/feed.tsx",
      errors: [{ messageId: "option" }],
    },
    {
      code: `${head}connectEventStream('/feed', { method: 'POST', body: {} });`,
      filename: "pages/feed.tsx",
      errors: [{ messageId: "option" }],
    },
  ],
});
