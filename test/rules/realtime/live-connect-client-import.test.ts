import rule from "../../../src/plugin/rules/realtime/live-connect-client-import.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("live-connect-client-import", rule, {
  valid: [
    {
      code: "import { connectLiveStream } from 'void/live/client';",
      filename: "pages/feed.tsx",
    },
    { code: "import { x } from 'void/live';", filename: "src/live.ts" },
    // a module of the app may re-export the helper
    { code: "import { connectLiveStream } from './live';", filename: "pages/feed.tsx" },
    { code: "const x = 1;", filename: "routes/api.ts" },
    // guide/live.md:49
    {
      code: "import { connectLiveStream } from 'void/live/client';\nconst stream = connectLiveStream('/live', { withCredentials: true, retryDelay: 1_000 });",
      filename: "pages/_lib/live.ts",
    },
  ],
  invalid: [
    {
      code: "import { connectLiveStream } from 'void/live';",
      filename: "pages/feed.tsx",
      errors: [{ messageId: "source" }],
    },
    {
      code: "import { connectLiveStream as connect } from 'void/sse/client';",
      filename: "pages/feed.tsx",
      errors: [{ messageId: "source" }],
    },
  ],
});
