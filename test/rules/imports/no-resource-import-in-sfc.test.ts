import rule from "../../../src/plugin/rules/imports/no-resource-import-in-sfc.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-resource-import-in-sfc", rule, {
  valid: [
    { code: "import { db } from 'void/db';", filename: "pages/home.server.ts" },
    { code: "import { ref } from 'vue';", filename: "components/Card.vue" },
    {
      // reference/resource-inference.md:94-101 (the same import is fine in a scanned .ts file).
      code: "import { defineLiveStream } from 'void/live';\nexport const live = defineLiveStream({ id: 'app', allowAnonymousControl: true });",
      filename: "src/live.ts",
    },
  ],
  invalid: [
    {
      code: "import { db } from 'void/db';",
      filename: "pages/home.vue",
      errors: [{ messageId: "resource" }],
    },
    {
      code: "import { kv } from 'void/kv';",
      filename: "lib/Widget.svelte",
      errors: [{ messageId: "resource" }],
    },
  ],
});
