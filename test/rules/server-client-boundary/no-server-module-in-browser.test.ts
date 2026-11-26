import rule from "../../../src/plugin/rules/server-client-boundary/no-server-module-in-browser.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-server-module-in-browser", rule, {
  valid: [
    { code: "import type { Props } from './home.server';", filename: "pages/home.tsx" },
    { code: "import { db } from 'void/db';", filename: "pages/home.server.ts" },
    // a type import of a server module is erased
    { code: "import type { Db } from 'void/db';", filename: "pages/home.tsx" },
    { code: "import { type Db } from 'void/db';", filename: "pages/_lib/db.ts" },
    // browser helpers of the same services
    {
      code: "import { connectLiveStream } from 'void/live/client';",
      filename: "pages/feed.tsx",
    },
    // routes/ is server code
    { code: "import { db } from 'void/db';", filename: "routes/api/users.ts" },
    { code: "import { db } from 'void/db';", filename: "pages/_home.test.tsx" },
    // guide/websockets.md:206: getRoom from void/ws/server in server code
    { code: "import { getRoom } from 'void/ws/server';", filename: "routes/x.ts" },
    // guide/ai.md:8 (the `ai` import belongs to server code)
    { code: "import { ai } from 'void/ai';", filename: "pages/chat.server.ts" },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "server" }],
    },
    {
      code: "import { ai } from 'void/ai';",
      filename: "pages/_components/Feed.tsx",
      errors: [{ messageId: "server" }],
    },
    {
      code: "import { getRoom } from 'void/ws/server';",
      filename: "pages/x.tsx",
      errors: [{ messageId: "server" }],
    },
    {
      code: "import { live } from 'void/live';",
      filename: "pages/chat.island.tsx",
      errors: [{ messageId: "server" }],
    },
    {
      code: "const { db } = await import('void/db');",
      filename: "pages/home.tsx",
      errors: [{ messageId: "server" }],
    },
  ],
});
