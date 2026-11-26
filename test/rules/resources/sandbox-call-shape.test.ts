import rule from "../../../src/plugin/rules/resources/sandbox-call-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { getSandbox } from 'void/sandbox';\n";

new RuleTester().run("sandbox-call-shape", rule, {
  valid: [
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.run(['ls', '-la']);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.exec(['sh', '-c', 'ls | wc -l']);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.files.readFile('/app/a.txt');`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.files.readFile('a.txt', { cwd: '/app' });`,
      filename: "routes/a.ts",
    },
    // A file with no sandbox in it, and a `run` that is not on a sandbox.
    { code: "await job.run('ls -la');", filename: "routes/a.ts" },
    { code: "export {};", filename: "pages/about.tsx" },
    // guide/sandboxes.md line 37: the docs' own example.
    {
      code: `${head}const sandbox = await getSandbox(\`user-\${user.id}\`, {
  inactivityTimeoutMs: 10 * 60 * 1000,
  enableInternet: false,
});
const result = await sandbox.run(['node', '--version'], {
  signal: AbortSignal.timeout(5_000),
});`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.run('ls -la');`,
      filename: "routes/a.ts",
      errors: [{ messageId: "shellString" }],
    },
    {
      code: `${head}const sb = await getSandbox('a');\nawait sb.exec(\`echo \${x}\`);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "shellString" }],
    },
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.files.readFile('a.txt');`,
      filename: "routes/a.ts",
      errors: [{ messageId: "relativePath" }],
    },
    {
      code: `${head}const sb = getSandbox('a');\nawait sb.files.writeFile('out/b.txt', data);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "relativePath" }],
    },
  ],
});
