import rule from "../../../src/plugin/rules/pages/no-eager-prefetch.ts";
import { RuleTester } from "../../rule-tester.ts";

const LINK = "import { Link } from '@void/react';\n";
const PLUGIN = "import { voidReact } from '@void/react/plugin';\n";

new RuleTester().run("no-eager-prefetch", rule, {
  valid: [
    { code: LINK + '<Link href="/a" prefetch="hover" />;', filename: "pages/a.tsx" },
    { code: LINK + '<Link href="/a" prefetch="click" />;', filename: "pages/a.tsx" },
    {
      code: "import { Link } from './link';\n<Link prefetch=\"mount\" />;",
      filename: "pages/a.tsx",
    },
    {
      // reference/api/pages.md:47 combines 'visible' with 'hover'.
      code: LINK + `<Link href="/a" prefetch={['visible', 'hover']} />;`,
      filename: "pages/a.tsx",
    },
    {
      code:
        PLUGIN +
        "export default { plugins: [voidReact({ prefetch: { defaultStrategy: 'hover' } })] };",
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: LINK + '<Link href="/a" prefetch="mount" />;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "eager" }],
    },
    {
      code: LINK + `<Link href="/a" prefetch={['visible']} />;`,
      filename: "pages/a.tsx",
      errors: [{ messageId: "eager" }],
    },
    {
      code:
        PLUGIN +
        "export default { plugins: [voidReact({ prefetch: { defaultStrategy: 'visible' } })] };",
      filename: "vite.config.ts",
      errors: [{ messageId: "eager" }],
    },
  ],
});
