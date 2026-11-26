import rule from "../../../src/plugin/rules/placement/no-env-file-crossing.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-env-file-crossing", rule, {
  valid: [
    { code: "import { Tools } from './_tools.dev';", filename: "pages/debug.dev.tsx" },
    { code: "import { Hero } from './_hero';", filename: "pages/home.tsx" },
    { code: "import { Stats } from './stats.dev';", filename: "lib/other.ts" },
    { code: "import { metrics } from './metrics.prod';", filename: "routes/report.prod.ts" },
    { code: "import type { Stats } from './stats.dev';", filename: "pages/home.tsx" },
    { code: "import { Stats } from './stats.dev';", filename: "pages/_home.test.tsx" },
    // reference/structure.md line 76 (routes/): `debug.dev.ts` and `metrics.prod.ts` are env-only files that import ordinary code
    {
      code: "import { db } from 'void/db';\nimport { render } from './_render';",
      filename: "routes/metrics.prod.ts",
    },
  ],
  invalid: [
    {
      code: "import { Stats } from './stats.dev';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "crossing" }],
    },
    {
      code: "export { metrics } from './metrics.prod.ts';",
      filename: "routes/api.ts",
      errors: [{ messageId: "crossing" }],
    },
    {
      code: "const m = import('./stats.dev');",
      filename: "pages/home.tsx",
      errors: [{ messageId: "crossing" }],
    },
    {
      code: "import { Prod } from './stats.prod';",
      filename: "pages/debug.dev.tsx",
      errors: [{ messageId: "crossing" }],
    },
  ],
});
