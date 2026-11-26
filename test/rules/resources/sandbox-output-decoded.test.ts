import rule from "../../../src/plugin/rules/resources/sandbox-output-decoded.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { getSandbox } from 'void/sandbox';\nconst sb = getSandbox('a');\n";

new RuleTester().run("sandbox-output-decoded", rule, {
  valid: [
    {
      code: `${head}const r = await sb.run(['ls']);\nconst out = new TextDecoder().decode(r.stdout);`,
      filename: "routes/a.ts",
    },
    {
      code: `${head}const r = await sb.run(['ls']);\nreturn new Response(r.stdout);`,
      filename: "routes/a.ts",
    },
    // A file with no sandbox, and a result that is not a sandbox's.
    { code: "const r = await job.run(['ls']);\nconst s = `${r.stdout}`;", filename: "routes/a.ts" },
    {
      code: `import { getSandbox } from 'void/sandbox';\nconst sb = getSandbox('a');\nconst o = await other.run(['ls']);\nconst s = o.stdout + '!';`,
      filename: "routes/a.ts",
    },
    // guide/sandboxes.md line 15: the docs' own example decodes stdout.
    {
      code: `import { getSandbox } from 'void/sandbox';
export const POST = defineHandler(async (c) => {
  const sandbox = await getSandbox('default');
  const result = await sandbox.run(['node', '--version']);
  return c.json({
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout),
  });
});`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: `${head}const r = await sb.run(['ls']);\nconst s = \`out: \${r.stdout}\`;`,
      filename: "routes/a.ts",
      errors: [{ messageId: "buffer" }],
    },
    {
      code: `${head}const r = await sb.run(['ls']);\nconst t = r.stderr + '!';`,
      filename: "routes/a.ts",
      errors: [{ messageId: "buffer" }],
    },
    {
      code: `${head}const { stdout } = await sb.run(['ls']);\nconst lines = stdout.split('\\n');`,
      filename: "routes/a.ts",
      errors: [{ messageId: "buffer" }],
    },
    {
      code: `${head}const r = await sb.run(['ls']);\nJSON.stringify({ a: 1 }, null, 0); JSON.stringify(r.stdout);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "buffer" }],
    },
  ],
});
