import rule from "../../../src/plugin/rules/server-client-boundary/no-sse-client-in-server.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-sse-client-in-server", rule, {
  valid: [
    {
      code: "import { connectEventStream } from 'void/sse/client';",
      filename: "pages/feed.tsx",
    },
    { code: "import { eventStream } from 'void/sse';", filename: "routes/feed.ts" },
    { code: "import type { Stream } from 'void/sse/client';", filename: "routes/feed.ts" },
    {
      code: "import { connectEventStream } from 'void/sse/client';",
      filename: "src/client/stream.ts",
    },
    // guide/sse.md:122: the client import in browser code
    {
      code: "import { connectEventStream } from 'void/sse/client';\nconst stream = connectEventStream('/api/events', { withCredentials: true });",
      filename: "pages/_features/events.ts",
    },
  ],
  invalid: [
    {
      code: "import { connectEventStream } from 'void/sse/client';",
      filename: "routes/feed.ts",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import 'void/sse/client';",
      filename: "middleware/01.x.ts",
      errors: [{ messageId: "client" }],
    },
    {
      code: "import { connectEventStream } from 'void/sse/client';",
      filename: "pages/feed.server.ts",
      errors: [{ messageId: "client" }],
    },
  ],
});
