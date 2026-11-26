import rule from "../../../src/plugin/rules/imports/void-deploy-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { prepareCfBuildOutput } from 'void/deploy';\n";

new RuleTester().run("void-deploy-usage", rule, {
  valid: [
    { code: head, filename: "scripts/prepare.ts" },
    { code: "export const GET = defineHandler(() => 1);", filename: "routes/ok.ts" },
    {
      code: `${head}async function run(o) {\n  const out = await prepareCfBuildOutput(o);\n  try { await publish(out); } finally { await out.dispose(); }\n}`,
      filename: "scripts/prepare.ts",
    },
    {
      code: `${head}async function run(o) {\n  const out = await prepareCfBuildOutput(o);\n  await out.dispose();\n}`,
      filename: "scripts/prepare.ts",
    },
    {
      // reference/api/deploy.md:44-60 (check for null, then dispose in finally).
      code: `${head}const prepared = await prepareCfBuildOutput('/path/to/app/dist/server', {\n  projectRoot: '/path/to/app',\n  mode: 'staging',\n});\nif (!prepared) {\n  throw new Error('The Worker build could not be prepared.');\n}\n\ntry {\n  // Inspect or pass prepared.directory to your Cloudflare publication workflow.\n} finally {\n  await prepared.dispose();\n}`,
      filename: "scripts/publish.ts",
    },
  ],
  invalid: [
    {
      code: "import { prepareCfBuildOutput } from 'void/deploy';",
      filename: "routes/build.ts",
      errors: [{ messageId: "runtime" }],
    },
    {
      code: "import 'void/deploy';",
      filename: "pages/home.server.ts",
      errors: [{ messageId: "runtime" }],
    },
    {
      code: `${head}async function run(o) {\n  const out = await prepareCfBuildOutput(o);\n  await publish(out);\n}`,
      filename: "scripts/prepare.ts",
      errors: [{ messageId: "dispose" }],
    },
    {
      code: `${head}async function run(o) {\n  const out = await prepareCfBuildOutput(o);\n  return out.directory;\n}`,
      filename: "scripts/prepare.ts",
      errors: [{ messageId: "dispose" }],
    },
  ],
});
