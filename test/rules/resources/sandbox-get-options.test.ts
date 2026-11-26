import rule from "../../../src/plugin/rules/resources/sandbox-get-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { getSandbox } from 'void/sandbox';\n";

new RuleTester().run("sandbox-get-options", rule, {
  valid: [
    { code: `${head}getSandbox('build-1');`, filename: "routes/a.ts" },
    { code: `${head}getSandbox(id);`, filename: "routes/a.ts" },
    {
      code: `${head}getSandbox('a', { inactivityTimeoutMs: 6 * 60 * 60 * 1000 });`,
      filename: "routes/a.ts",
    },
    { code: `${head}getSandbox('a', { inactivityTimeoutMs: 60000 });`, filename: "routes/a.ts" },
    // Not the getSandbox of void/sandbox.
    { code: "getSandbox('');", filename: "routes/a.ts" },
    // guide/sandboxes.md line 37: the docs' own example.
    {
      code: `${head}const sandbox = await getSandbox(\`user-\${user.id}\`, {
  inactivityTimeoutMs: 10 * 60 * 1000,
  enableInternet: false,
});`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    { code: `${head}getSandbox('');`, filename: "routes/a.ts", errors: [{ messageId: "id" }] },
    {
      code: `${head}getSandbox('${"x".repeat(64)}');`,
      filename: "routes/a.ts",
      errors: [{ messageId: "id" }],
    },
    {
      code: `${head}getSandbox('a', { inactivityTimeoutMs: 7 * 60 * 60 * 1000 });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "timeout" }],
    },
    {
      code: `${head}getSandbox('a', { inactivityTimeoutMs: 30000000 });`,
      filename: "routes/a.ts",
      errors: [{ messageId: "timeout" }],
    },
  ],
});
