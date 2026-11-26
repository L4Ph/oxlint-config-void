import rule from "../../../src/plugin/rules/platform/no-platform-credentials-in-source.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-platform-credentials-in-source", rule, {
  valid: [
    { code: "process.env.CLOUDFLARE_API_TOKEN ?? '';", filename: "scripts/deploy.ts" },
    { code: "const t = process.env.VOID_TOKEN;", filename: "scripts/deploy.ts" },
    // dummy values in tests
    { code: "process.env.VOID_TOKEN = 'test';", filename: "scripts/deploy.test.ts" },
    // a value that is a reference, not a secret
    {
      code: "const env = { VOID_TOKEN: '${{ secrets.VOID_TOKEN }}' };",
      filename: "scripts/workflow.ts",
    },
    { code: "execSync('vp build');", filename: "scripts/build.ts" },
    { code: "execSync(`CLOUDFLARE_API_TOKEN=${token} vp build`);", filename: "scripts/build.ts" },
    // platform/installation/ci.md:49: the value comes from a protected CI secret
    { code: "const jwt = process.env.VOID_PLATFORM_JWT_SECRET;", filename: "scripts/install.ts" },
    // reference/cli/deploy.md:52: the credential comes from the CI secret
    {
      code: "execSync('vp build'); // API_KEY comes from the CI secret",
      filename: "scripts/build.ts",
    },
  ],
  invalid: [
    {
      code: "process.env.CLOUDFLARE_API_TOKEN = 'abc123';",
      filename: "scripts/deploy.ts",
      errors: [{ messageId: "literal" }],
    },
    {
      code: "execSync('CLOUDFLARE_API_TOKEN=abc123 vp build');",
      filename: "scripts/build.ts",
      errors: [{ messageId: "command" }],
    },
    {
      code: "const options = { env: { VOID_PLATFORM_JWT_SECRET: 'abc123' } };",
      filename: "scripts/install.ts",
      errors: [{ messageId: "literal" }],
    },
    {
      code: "exec('void deploy --token abcdef0123456789abcdef');",
      filename: "scripts/deploy.ts",
      errors: [{ messageId: "command" }],
    },
  ],
});
