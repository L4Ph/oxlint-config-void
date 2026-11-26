import rule from "../../../src/plugin/rules/edge/routing-headers-cache-scope.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-headers-cache-scope", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { headers: { '/assets/*': ['Cache-Control: public, max-age=31536000, immutable'] } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['X-Frame-Options: DENY'] } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Cache-Control: no-store'] } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { headers: { '/*': ['Cache-Control: public'] } } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/headers.md:11, the custom headers example.
      code: `export default defineConfig({
  routing: {
    headers: {
      '/assets/*': ['Cache-Control: public, max-age=31536000, immutable'],
      '/*': ['X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff'],
      '/*.html': ['Cache-Control: no-cache'],
    },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Cache-Control: public, max-age=3600'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "public" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Cache-Control: immutable'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "immutable" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/api/auth/*': ['cache-control: s-maxage=60'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "public" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*.html': ['Cache-Control: public, max-age=31536000, immutable'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "immutable" }],
    },
  ],
});
