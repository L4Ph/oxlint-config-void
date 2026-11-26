import rule from "../../../src/plugin/rules/imports/resource-import-in-scanned-dir.ts";
import { RuleTester } from "../../rule-tester.ts";

const live = "import { defineLiveStream } from 'void/live';";

new RuleTester().run("resource-import-in-scanned-dir", rule, {
  valid: [
    { code: live, filename: "src/live.ts" },
    { code: live, filename: "routes/_lib/live.ts" },
    { code: live, filename: "lib/live.ts", options: [{ scanDirs: ["src", "lib"] }] },
    // Not governed: other resources are not checked (integrations/hono.md:113 imports void/auth from lib/).
    { code: "import { db } from 'void/db';", filename: "lib/db.ts" },
    {
      code: "import { db } from 'void/db';",
      filename: "lib/live.ts",
      settings: { void: { sourceDir: "lib" } },
    },
    {
      // guide/live.md:15-22 (the live stream module sits in src/).
      code: "import { defineLiveStream } from 'void/live';\n\nexport const live = defineLiveStream({\n  id: 'app',\n  allowAnonymousControl: true,\n});",
      filename: "src/live.ts",
    },
  ],
  invalid: [
    { code: live, filename: "server/live.ts", errors: [{ messageId: "unscanned" }] },
    { code: live, filename: "lib/live.ts", errors: [{ messageId: "unscanned" }] },
    {
      // scanDirs replaces the default list: pages/ is no longer scanned.
      code: live,
      filename: "pages/live.ts",
      options: [{ scanDirs: ["routes"] }],
      errors: [{ messageId: "unscanned" }],
    },
  ],
});
