import rule from "../../../src/plugin/rules/env/env-schema-safe-keys.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("env-schema-safe-keys", rule, {
  valid: [
    {
      // An endpoint whose name contains TOKEN is not a credential: the helper says it is a URL.
      code: 'import { defineEnv, url } from "void/env";\nexport default defineEnv({ OAUTH_TOKEN_URL: url().default("https://id.example.com/oauth2/token") });',
      filename: "env.ts",
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ VITE_PUBLISHABLE_KEY: z.string() });",
      filename: "env.ts",
    },
    { code: "const u = import.meta.env.VITE_API_URL;", filename: "pages/a.tsx" },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ API_KEY: z.string(), REGION: z.string().default('eu') });",
      filename: "env.ts",
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ MODE: z.string().default('dev') });",
      filename: "env.ts",
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ VITE_SITE_URL: z.string() });",
      filename: "env.ts",
    },
    // A file the rule does not govern: PUBLIC_ outside env.ts.
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ PUBLIC_SITE_URL: z.string() });",
      filename: "lib/other.ts",
    },
    {
      // guide/env-vars.md line 14: the schema example.
      code: `import { defineEnv, number, string, url } from 'void/env';
export default defineEnv({
  DATABASE_URL: url(),
  STRIPE_KEY: string(),
  PORT: number().default(3000),
  VITE_API_ORIGIN: url(),
});`,
      filename: "env.ts",
    },
    {
      // guide/env-vars.md line 95: a client value with a default.
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ VITE_API_ORIGIN: url().default('https://api.example.com') });",
      filename: "env.ts",
    },
  ],
  invalid: [
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ VITE_STRIPE_SECRET: z.string() });",
      filename: "env.ts",
      errors: [{ messageId: "secretClient" }],
    },
    {
      code: "const t = import.meta.env.VITE_API_TOKEN;",
      filename: "pages/a.tsx",
      errors: [{ messageId: "secretClient" }],
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ API_KEY: z.string().default('abc123') });",
      filename: "env.ts",
      errors: [{ messageId: "secretDefault" }],
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ SESSION_SECRET: z.string().default('x') });",
      filename: "env.ts",
      errors: [{ messageId: "secretDefault" }],
    },
    {
      code: "import { defineEnv } from 'void/env';\nexport default defineEnv({ PUBLIC_SITE_URL: z.string() });",
      filename: "env.ts",
      errors: [{ messageId: "publicPrefix" }],
    },
  ],
});
