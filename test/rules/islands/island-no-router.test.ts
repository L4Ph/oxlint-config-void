import rule from "../../../src/plugin/rules/islands/island-no-router.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("island-no-router", rule, {
  valid: [
    { code: 'export default () => <a href="/about">About</a>;', filename: "pages/blog.island.tsx" },
    { code: "import { useIslandForm } from '@void/react';", filename: "pages/blog.island.tsx" },
    {
      // A regular page has the router.
      code: "import { Link } from '@void/react';",
      filename: "pages/blog.tsx",
    },
    { code: "import { Link } from './link';", filename: "pages/blog.island.tsx" },
    {
      // guide/pages-routing/islands.md:359-360
      code: `export default function Page() {
  return <a href="/blog/my-post">Read more</a>;
}`,
      filename: "pages/blog/index.island.tsx",
    },
  ],
  invalid: [
    {
      code: "import { Link } from '@void/react';",
      filename: "pages/blog.island.tsx",
      errors: [{ messageId: "router" }],
    },
    {
      code: "import { useRouter } from '@void/react';",
      filename: "pages/blog.island.tsx",
      errors: [{ messageId: "router" }],
    },
    {
      code: "import { useNavigation, useIslandForm } from '@void/solid';",
      filename: "pages/blog/[slug].island.tsx",
      errors: [{ messageId: "router" }],
    },
  ],
});
