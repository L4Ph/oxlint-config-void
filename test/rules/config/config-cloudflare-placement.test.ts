import rule from "../../../src/plugin/rules/config/config-cloudflare-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-cloudflare-placement", rule, {
  valid: [
    {
      code: "export default defineConfig({ cloudflare: { d1_databases: [] } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ worker: { vars: { A: '1' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ cloudflare: { name: 'app' } });",
      filename: "void.config.ts",
    },
    { code: "export default defineConfig({});", filename: "void.config.ts" },
    {
      code: "export default defineConfig({ cloudflare: { routes: [{ pattern: 'a.dev', custom_domain: true }] } });",
      filename: "void.config.ts",
    },
    // `ai` is a top-level field of defineConfig itself.
    {
      code: "export default defineConfig({ ai: { gateway: 'my-gateway' } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default { name: 'app', routes: [] };", filename: "wrangler.config.ts" },
    {
      // integrations/cloudflare.md:68, the Cloudflare configuration example.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  worker: {
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat'],
  },
  cloudflare: {
    name: 'my-app',
    services: [{ binding: 'API', service: 'my-api-worker' }],
  },
});`,
      filename: "void.config.ts",
    },
    {
      // reference/config.md:378, the deploy mode example.
      code: "export default defineConfig({ deploy: { cloudflare: { mode: 'atomic' } } });",
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ worker: { kv_namespaces: [] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "misplaced" }],
    },
    {
      code: "export default defineConfig({ routes: [] });",
      filename: "void.config.ts",
      errors: [{ messageId: "misplaced" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { env: { staging: {} } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "environments" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { environments: {} } });",
      filename: "void.config.ts",
      errors: [{ messageId: "environments" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { route: 'a.dev/*' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "legacyRoute" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { deploy: { cloudflare: { mode: 'atomic' } } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "deployInside" }],
    },
    {
      code: "export default defineConfig({ deploy: { cloudflare: { mode: 'rolling' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "deployMode" }],
    },
  ],
});
