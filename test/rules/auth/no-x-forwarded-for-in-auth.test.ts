import rule from "../../../src/plugin/rules/auth/no-x-forwarded-for-in-auth.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-x-forwarded-for-in-auth", rule, {
  valid: [
    { code: "const ip = headers.get('cf-connecting-ip');", filename: "auth.ts" },
    { code: "const k = headers.get('x-internal-key');", filename: "auth.ts" },
    // Not governed: only the root auth.ts is checked.
    { code: "const ip = headers.get('x-forwarded-for');", filename: "routes/a.ts" },
    {
      // guide/auth.md:213-228 (the secret-header check).
      code: "import { defineAuth } from 'void/auth';\n\nexport default defineAuth(({ defaults, env }) => ({\n  ...defaults,\n  rateLimit: {\n    customRules: {\n      '/**': (request, rule) =>\n        env.AUTH_TRUSTED_KEY && request.headers.get('x-auth-trusted-key') === env.AUTH_TRUSTED_KEY\n          ? false\n          : rule,\n    },\n  },\n}));",
      filename: "auth.ts",
    },
  ],
  invalid: [
    {
      code: "const ip = headers.get('x-forwarded-for');",
      filename: "auth.ts",
      errors: [{ messageId: "header" }],
    },
    {
      code: "const ip = request.headers.get('X-Forwarded-For');",
      filename: "auth.ts",
      errors: [{ messageId: "header" }],
    },
    {
      code: "const opts = { 'x-forwarded-for': 1 };",
      filename: "auth.ts",
      errors: [{ messageId: "header" }],
    },
  ],
});
