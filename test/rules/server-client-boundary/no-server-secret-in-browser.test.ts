import rule from "../../../src/plugin/rules/server-client-boundary/no-server-secret-in-browser.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-server-secret-in-browser", rule, {
  valid: [
    {
      code: "import { env } from 'void/env';\nconst k = env.VITE_PUBLIC_URL;",
      filename: "pages/home.tsx",
    },
    {
      code: "import { env } from 'void/env';\nconst s = env.STRIPE_SECRET;",
      filename: "pages/home.server.ts",
    },
    { code: "const k = env.AUTH_TRUSTED_KEY;", filename: "pages/home.server.ts" },
    { code: "const x = 1;", filename: "pages/home.tsx" },
    { code: "const env = { STRIPE: 1 };\nenv.STRIPE;", filename: "pages/home.tsx" },
    // guide/auth.md:231 sits in auth.ts, which is server code
    {
      code: "const limit = env.AUTH_TRUSTED_KEY && request.headers.get('x-auth-trusted-key') === env.AUTH_TRUSTED_KEY;",
      filename: "auth.ts",
    },
    // reference/api/env.md:39: VITE_ keys are public build-time client values
    {
      code: "import { env } from 'void/env';\nconst url = env.VITE_API_URL;",
      filename: "pages/_lib/api.ts",
    },
  ],
  invalid: [
    {
      code: "import { env } from 'void/env';\nconst k = env.STRIPE_SECRET;",
      filename: "pages/home.tsx",
      errors: [{ messageId: "env" }],
    },
    {
      code: "import { env } from 'void/env';\nenv['API_KEY'];",
      filename: "pages/_components/Pay.tsx",
      errors: [{ messageId: "env" }],
    },
    {
      code: "const k = env.AUTH_TRUSTED_KEY;",
      filename: "pages/home.tsx",
      errors: [{ messageId: "trustedKey" }],
    },
    {
      code: "const k = 'AUTH_TRUSTED_KEY';",
      filename: "pages/_lib/t.ts",
      errors: [{ messageId: "trustedKey" }],
    },
  ],
});
