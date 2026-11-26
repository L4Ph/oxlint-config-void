import rule from "../../../src/plugin/rules/config/config-always-https-cloudflare-only.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-always-https-cloudflare-only", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { alwaysUseHttps: true } });",
      filename: "void.config.ts",
    },
    { code: "export default defineConfig({ target: 'node' });", filename: "void.config.ts" },
    {
      code: "export default defineConfig({ target: 'cloudflare', routing: { alwaysUseHttps: true } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { target: 'node', routing: { alwaysUseHttps: true } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/redirects.md:62, the HTTP to HTTPS example.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  routing: {
    alwaysUseHttps: true,
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ target: 'node', routing: { alwaysUseHttps: true } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cloudflareOnly" }],
    },
    {
      code: "export default defineConfig({ target: 'deno', routing: { alwaysUseHttps: true } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cloudflareOnly" }],
    },
  ],
});
