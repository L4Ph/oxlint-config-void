import rule from "../../../src/plugin/rules/typed-urls/route-types-from-void-routes.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("route-types-from-void-routes", rule, {
  valid: [
    { code: "import type { PageParams } from 'void/routes';", filename: "pages/x.server.ts" },
    { code: "import type { RouteUrl } from 'void/routes';", filename: "pages/x.server.ts" },
    {
      // Not Void's: the author's own module.
      code: "import type { Href } from './href';",
      filename: "pages/x.tsx",
    },
    {
      // guide/type-safety.md:348-349 and reference/api/types.md:90-95
      code: "import { routeUrl, type Href } from 'void/routes';\nimport type { RouteMap } from 'void/routes';",
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: "import type { PageParams } from 'void';",
      filename: "pages/x.server.ts",
      errors: [{ messageId: "source" }],
    },
    {
      code: "import type { RouteUrl } from 'void/pages';",
      filename: "pages/x.server.ts",
      errors: [{ messageId: "source" }],
    },
  ],
});
