import rule from "../../../src/plugin/rules/edge/routing-headers-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-headers-shape", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['X-Frame-Options: DENY'] } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/assets/*': ['X-A: 1', 'X-B: 2'] } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Clear-Site-Data: \"cache\"'] } } });",
      filename: "void.config.ts",
    },
    // The value may contain colons.
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Link: <https://a.dev>; rel=preconnect'] } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { headers: { 'api/*': 'X-A' } } };",
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
      code: "export default defineConfig({ routing: { headers: { '/*': 'X-Frame-Options: DENY' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "list" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { 'api/*': ['X-A: 1'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['no colon here'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "entry" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/*': ['Set-Cookie: a=1'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cookie" }],
    },
    {
      code: "export default defineConfig({ routing: { headers: { '/out': ['Clear-Site-Data: \"cookies\"'] } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "clearSiteData" }],
    },
  ],
});
