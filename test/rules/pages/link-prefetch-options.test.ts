import rule from "../../../src/plugin/rules/pages/link-prefetch-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const LINK = "import { Link } from '@void/react';\n";
const PLUGIN = "import { voidReact } from '@void/react/plugin';\n";

new RuleTester().run("link-prefetch-options", rule, {
  valid: [
    { code: LINK + '<Link href="/a" prefetch="hover" />;', filename: "pages/a.tsx" },
    { code: LINK + `<Link href="/a" prefetch={['visible', 'hover']} />;`, filename: "pages/a.tsx" },
    { code: LINK + '<Link href="/a" cacheFor="5m" />;', filename: "pages/a.tsx" },
    { code: LINK + `<Link href="/a" cacheFor={['30s', '5m']} />;`, filename: "pages/a.tsx" },
    {
      code: LINK + '<Link href="/a" cacheFor={5000} prefetch={false} />;',
      filename: "pages/a.tsx",
    },
    {
      // Not the adapter's Link: the rule leaves another component's props alone.
      code: 'import { Link } from \'./my-link\';\n<Link href="/a" prefetch="eager" />;',
      filename: "pages/a.tsx",
    },
    {
      code:
        PLUGIN +
        "export default { plugins: [voidReact({ prefetch: { defaultStrategy: 'hover', cacheFor: ['30s', '5m'] } })] };",
      filename: "vite.config.ts",
    },
    {
      // guide/pages-routing/overview.md:482
      code: LINK + '<Link href="/dashboard" prefetch>Dashboard</Link>;',
      filename: "pages/a.tsx",
    },
  ],
  invalid: [
    {
      code: LINK + '<Link href="/a" prefetch="eager" />;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "strategy" }],
    },
    {
      code: LINK + `<Link href="/a" prefetch={['hover', 'idle']} />;`,
      filename: "pages/a.tsx",
      errors: [{ messageId: "strategy" }],
    },
    {
      code: LINK + '<Link href="/a" cacheFor={true} />;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "cacheFor" }],
    },
    {
      code: LINK + `<Link href="/a" cacheFor={['1m']} />;`,
      filename: "pages/a.tsx",
      errors: [{ messageId: "cacheFor" }],
    },
    {
      code:
        PLUGIN +
        "export default { plugins: [voidReact({ prefetch: { defaultStrategy: 'idle' } })] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "strategy" }],
    },
  ],
});
