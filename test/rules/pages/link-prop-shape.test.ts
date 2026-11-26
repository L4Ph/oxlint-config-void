import rule from "../../../src/plugin/rules/pages/link-prop-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const LINK = "import { Link } from '@void/react';\n";

new RuleTester().run("link-prop-shape", rule, {
  valid: [
    { code: LINK + '<Link href="/logout" method="post">Log out</Link>;', filename: "pages/a.tsx" },
    { code: LINK + '<Link href="/a" prefetch="hover">A</Link>;', filename: "pages/a.tsx" },
    {
      code: LINK + "<Link href=\"/s\" data={{ q: 'a', tags: ['x', 'y'] }}>S</Link>;",
      filename: "pages/a.tsx",
    },
    { code: LINK + '<Link href="/s" data={{ page: 2 }}>S</Link>;', filename: "pages/a.tsx" },
    {
      // A different Link component.
      code: "import { Link } from './link';\n<Link method=\"post\" prefetch />;",
      filename: "pages/a.tsx",
    },
    {
      // reference/api/pages.md:172 allows a mutation link; `prefetch={false}` does not prefetch.
      code: LINK + '<Link href="/x" method="delete" prefetch={false}>X</Link>;',
      filename: "pages/a.tsx",
    },
    {
      // guide/pages-routing/overview.md:283-293 (Solid tab), with the semicolons the page leaves out
      code: `import { Link } from '@void/solid';

<Link href="/users" data={{ page: 2, tag: ['active', 'new'] }}>
  Filtered users
</Link>;

<Link href="/logout" reloadDocument>
  Sign out
</Link>;`,
      filename: "pages/a.tsx",
    },
  ],
  invalid: [
    {
      code: LINK + '<Link href="/logout" method="post" prefetch="hover">Log out</Link>;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "getOnly" }],
    },
    {
      code: LINK + '<Link href="/x" method="delete" reloadDocument>X</Link>;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "getOnly" }],
    },
    {
      code: LINK + '<Link href="/s" data={{ filter: { a: 1 } }}>S</Link>;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "nested" }],
    },
    {
      code: LINK + '<Link href="/s" data={{ rows: [{ a: 1 }] }}>S</Link>;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "nested" }],
    },
  ],
});
