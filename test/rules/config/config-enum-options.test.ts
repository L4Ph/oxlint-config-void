import rule from "../../../src/plugin/rules/config/config-enum-options.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-enum-options", rule, {
  valid: [
    {
      code: "export default defineConfig({ auth: { providers: ['email', 'github'] } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ auth: { providers: ['google'] } });",
      filename: "void.config.ts",
    },
    { code: "export default defineConfig({ target: 'node' });", filename: "void.config.ts" },
    { code: "export default defineConfig({ target: 'cloudflare' });", filename: "void.config.ts" },
    {
      code: "export default defineConfig({ storage: { locationHint: 'apac' } });",
      filename: "void.config.ts",
    },
    // The default image is named without a registry host.
    {
      code: "export default defineConfig({ sandbox: { platformImage: 'cloudflare/debian-trixie' } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default { target: 'workers' };", filename: "tsdown.config.ts" },
    {
      // reference/config.md:261, the sandbox example (with its `<digest>` placeholder).
      code: `export default defineConfig({
  sandbox: {
    image: './Dockerfile.sandbox',
    platformImage: 'registry.cloudflare.com/<account-id>/sandbox@sha256:<digest>',
    instanceType: 'standard-1',
  },
});`,
      filename: "void.config.ts",
    },
    {
      // reference/config.md:84, the providers example.
      code: "export default defineConfig({ auth: { providers: ['email', 'github', 'google', 'discord'] } });",
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ auth: { providers: ['githb'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "provider" }],
    },
    {
      code: "export default defineConfig({ auth: { providers: ['facebok'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "provider" }],
    },
    {
      code: "export default defineConfig({ target: 'workers' });",
      filename: "void.config.ts",
      errors: [{ messageId: "target" }],
    },
    {
      code: "export default defineConfig({ target: 'vercel' });",
      filename: "void.config.ts",
      errors: [{ messageId: "target" }],
    },
    {
      code: "export default defineConfig({ storage: { locationHint: 'asia' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "locationHint" }],
    },
    {
      code: "export default defineConfig({ sandbox: { instanceType: 'xlarge' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "instanceType" }],
    },
    {
      code: "export default defineConfig({ sandbox: { platformImage: 'registry.cloudflare.com/acct/sandbox:latest' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "platformImage" }],
    },
    {
      code: "export default defineConfig({ sandbox: { platformImage: 'docker.io/acme/sandbox@sha256:abc123' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "platformImage" }],
    },
  ],
});
