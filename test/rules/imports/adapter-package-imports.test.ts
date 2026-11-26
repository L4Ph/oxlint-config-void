import rule from "../../../src/plugin/rules/imports/adapter-package-imports.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("adapter-package-imports", rule, {
  valid: [
    { code: "import { Link, useRouter } from '@void/react';", filename: "pages/a.tsx" },
    { code: "import { useForm } from '@void/vue';", filename: "pages/a.ts" },
    { code: "import type { Deferred } from '@void/react';", filename: "pages/a.tsx" },
    { code: "import { defer } from 'void';", filename: "pages/a.server.ts" },
    { code: "import { voidReact } from '@void/react/plugin';", filename: "vite.config.ts" },
    // Not Void: a local module that happens to export a Link.
    {
      code: "import { Link } from './link';\nimport type { Deferred } from './types';",
      filename: "src/a.tsx",
    },
    {
      // reference/api/pages.md:123-130 (the React plugin in vite.config.ts).
      code: "import { voidReact } from '@void/react/plugin';\nexport default defineConfig({\n  plugins: [voidPlugin(), voidReact()],\n});",
      filename: "vite.config.ts",
    },
  ],
  invalid: [
    {
      code: "import { Link } from 'void';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "runtime" }],
    },
    {
      code: "import { useForm } from 'void/pages';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "runtime" }],
    },
    {
      code: "import type { Deferred } from 'void';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "deferred" }],
    },
    {
      code: "import { voidReact } from '@void/react';",
      filename: "vite.config.ts",
      errors: [{ messageId: "plugin" }],
    },
  ],
});
