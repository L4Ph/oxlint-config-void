import rule from "../../../src/plugin/rules/env/no-alias-import-in-config-files.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-alias-import-in-config-files", rule, {
  valid: [
    { code: "import theme from './lib/theme';", filename: "void.config.ts" },
    { code: "import { z } from 'zod';", filename: "env.ts" },
    // A file the rule does not govern.
    { code: "import theme from '@/lib/theme';", filename: "pages/a.tsx" },
    // reference/config.md line 47: relative and package imports are the supported forms.
    { code: "import { defineConfig } from 'void';", filename: "void.config.ts" },
  ],
  invalid: [
    {
      code: "import theme from '@/lib/theme';",
      filename: "void.config.ts",
      errors: [{ messageId: "alias" }],
    },
    {
      code: "import schema from '~/schema?raw';",
      filename: "env.ts",
      errors: [{ messageId: "alias" }],
    },
  ],
});
