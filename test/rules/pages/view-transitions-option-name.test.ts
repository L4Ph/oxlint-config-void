import rule from "../../../src/plugin/rules/pages/view-transitions-option-name.ts";
import { RuleTester } from "../../rule-tester.ts";

const PLUGIN = "import { voidReact } from '@void/react/plugin';\n";
const LINK = "import { Link } from '@void/react';\n";

new RuleTester().run("view-transitions-option-name", rule, {
  valid: [
    { code: PLUGIN + "voidReact({ viewTransitions: true });", filename: "vite.config.ts" },
    { code: LINK + '<Link href="/a" viewTransition={false}>A</Link>;', filename: "pages/a.tsx" },
    {
      code: "import { useRouter } from '@void/react';\nconst router = useRouter();\nrouter.visit('/a', { viewTransition: true });",
      filename: "pages/a.tsx",
    },
    {
      // Another `voidReact` is not the adapter's.
      code: "import { voidReact } from './mine';\nvoidReact({ viewTransition: true });",
      filename: "vite.config.ts",
    },
    {
      // guide/pages-routing/view-transitions.md:19 and 55-61
      code: `import { voidReact } from '@void/react/plugin';
import { Link } from '@void/react';

export default defineConfig({
  plugins: [voidPlugin(), voidReact({ viewTransitions: true })],
});

<Link href="/settings" viewTransition={false}>
  Settings
</Link>;

<Link href="/about" viewTransition>
  About
</Link>;`,
      filename: "pages/a.tsx",
    },
  ],
  invalid: [
    {
      code: PLUGIN + "voidReact({ viewTransition: true });",
      filename: "vite.config.ts",
      errors: [{ messageId: "plugin" }],
    },
    {
      code: PLUGIN + "voidReact({ viewTransitions: 'yes' });",
      filename: "vite.config.ts",
      errors: [{ messageId: "plugin" }],
    },
    {
      code: LINK + '<Link href="/a" viewTransitions={false}>A</Link>;',
      filename: "pages/a.tsx",
      errors: [{ messageId: "link" }],
    },
    {
      code: "import { useRouter } from '@void/react';\nconst router = useRouter();\nrouter.visit('/a', { viewTransitions: true });",
      filename: "pages/a.tsx",
      errors: [{ messageId: "link" }],
    },
  ],
});
