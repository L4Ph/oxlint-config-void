import rule from "../../../src/plugin/rules/frameworks/framework-compat-flags.ts";
import { RuleTester } from "../../rule-tester.ts";

const nuxt = { void: { framework: "nuxt" } };

new RuleTester().run("framework-compat-flags", rule, {
  valid: [
    {
      code: "export default defineConfig({ cloudflare: { compatibility_flags: ['nodejs_compat', 'nodejs_als'] } });",
      filename: "void.config.ts",
      settings: nuxt,
    },
    {
      code: "export default defineConfig({ worker: { compatibility_flags: ['nodejs_als'] } });",
      filename: "void.config.ts",
    },
    // Without the framework, nodejs_compat is not asked for (the Astro page lists only nodejs_als).
    {
      code: "export default defineConfig({ cloudflare: { compatibility_flags: ['nodejs_als'] } });",
      filename: "void.config.ts",
    },
    // No array to read, and the placement is disputed: nothing to report.
    {
      code: "export default defineConfig({ cloudflare: { name: 'a' } });",
      filename: "void.config.ts",
    },
    // Not the Void config.
    {
      code: "export default { cloudflare: { compatibility_flags: [] } };",
      filename: "nuxt.config.ts",
    },
    {
      // integrations/frameworks/nuxt.md, lines 58-68 (step 4, void.config.ts)
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: {
    name: 'my-app',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_compat', 'nodejs_als'],
  },
});`,
      filename: "void.config.ts",
      settings: nuxt,
    },
    {
      // integrations/frameworks/astro.md, lines 48-58 (step 4, void.config.ts)
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  cloudflare: {
    name: 'my-app',
    compatibility_date: '2026-02-24',
    compatibility_flags: ['nodejs_als'],
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ cloudflare: { compatibility_flags: ['nodejs_compat'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { compatibility_flags: [] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default defineConfig({ worker: { compatibility_flags: ['nodejs_als'] } });",
      filename: "void.config.ts",
      settings: { void: { framework: "analog" } },
      errors: [{ messageId: "missing" }],
    },
  ],
});
