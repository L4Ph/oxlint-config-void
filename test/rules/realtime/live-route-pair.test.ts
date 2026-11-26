import rule from "../../../src/plugin/rules/realtime/live-route-pair.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineHandler } from 'void';\nimport { live } from '../src/live';\n";

new RuleTester().run("live-route-pair", rule, {
  valid: [
    {
      code: `${head}export const GET = defineHandler((c) => live.connect(c));\nexport const POST = defineHandler((c) => live.control(c));`,
      filename: "routes/live.ts",
    },
    {
      code: `${head}export const GET = defineHandler((c) => live.connect(c, { owner }));\nexport const POST = defineHandler((c) => live.control(c, { owner }));`,
      filename: "routes/live.ts",
    },
    // not a route file
    {
      code: `${head}export const GET = defineHandler((c) => live.connect(c));`,
      filename: "src/live-route.ts",
    },
    // a connect() of something that is not a live stream
    {
      code: "import { db } from 'pg';\nexport const GET = defineHandler((c) => db.connect(c));",
      filename: "routes/db.ts",
    },
    // guide/live.md:33
    {
      code: `import { defineHandler } from 'void';
import { live } from '../src/live';

export const GET = defineHandler((c) => live.connect(c));
export const POST = defineHandler((c) => live.control(c));`,
      filename: "routes/live.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const GET = defineHandler((c) => live.connect(c));`,
      filename: "routes/live.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: `${head}export const GET = defineHandler((c) => live.connect(c, { owner: a }));\nexport const POST = defineHandler((c) => live.control(c, { owner: b }));`,
      filename: "routes/live.ts",
      errors: [{ messageId: "owner" }],
    },
    {
      code: `${head}export const POST = defineHandler((c) => live.connect(c));\nexport const GET = defineHandler((c) => live.control(c));`,
      filename: "routes/live.ts",
      errors: [{ messageId: "wrongHandler" }, { messageId: "wrongHandler" }],
    },
  ],
});
