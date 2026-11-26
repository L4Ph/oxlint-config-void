import rule from "../../../src/plugin/rules/config/config-worker-values.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-worker-values", rule, {
  valid: [
    {
      code: "export default defineConfig({ worker: { vars: { REGION: 'eu' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ worker: { vars: { A: `x` } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ worker: { limits: { cpu_ms: 50 } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ worker: { limits: { cpu_ms: 300000 } } });",
      filename: "void.config.ts",
    },
    // A value computed elsewhere is not judged.
    {
      code: "export default defineConfig({ worker: { vars: { A: String(process.env.A) } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { worker: { vars: { N: 3 } } };",
      filename: "src/settings.ts",
    },
    {
      // reference/config.md:324, the worker settings example (limits: reference/config.md:343).
      code: `export default defineConfig({
  worker: {
    compatibility_date: '2025-12-01',
    compatibility_flags: ['nodejs_compat'],
    vars: {
      PUBLIC_API_BASE: 'https://api.example.com',
    },
    limits: { cpu_ms: 30000 },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ worker: { vars: { DEBUG: true } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "varString" }],
    },
    {
      code: "export default defineConfig({ worker: { vars: { N: 3 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "varString" }],
    },
    {
      code: "export default defineConfig({ worker: { limits: { cpu_ms: 0 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cpuMs" }],
    },
    {
      code: "export default defineConfig({ worker: { limits: { cpu_ms: 400000 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cpuMs" }],
    },
    {
      code: "export default defineConfig({ worker: { limits: { cpu_ms: 2.5 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "cpuMs" }],
    },
  ],
});
