import rule from "../../../src/plugin/rules/config/config-file-define-config.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-file-define-config", rule, {
  valid: [
    {
      code: "import { defineConfig } from 'void/config';\nexport default defineConfig({});",
      filename: "void.config.ts",
    },
    {
      code: "import { defineConfig } from 'void/config';\nconst c = defineConfig({});\nexport default c;",
      filename: "void.config.ts",
    },
    // A default export that is not a literal object is not judged.
    {
      code: "import { base } from './base';\nexport default base;",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default { routing: {} };", filename: "tsdown.config.ts" },
    {
      // reference/config.md:15, the config file format example.
      code: `// void.config.ts
import { defineConfig } from 'void/config';

export default defineConfig({
  sourceDir: 'src',
  target: 'cloudflare',
  auth: { providers: ['email', 'github', 'google'] },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default { routing: {} };",
      filename: "void.config.ts",
      errors: [{ messageId: "notDefined" }],
    },
    {
      code: "import { defineConfig } from 'vite';\nexport default defineConfig({});",
      filename: "void.config.ts",
      errors: [{ messageId: "wrongImport" }],
    },
    {
      code: "import { defineConfig } from 'void';\nexport default defineConfig({});",
      filename: "void.config.ts",
      errors: [{ messageId: "wrongImport" }],
    },
    {
      code: "import { defineConfig } from 'void/config';\nexport const config = defineConfig({});",
      filename: "void.config.ts",
      errors: [{ messageId: "noDefault" }],
    },
  ],
});
