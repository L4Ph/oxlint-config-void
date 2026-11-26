import rule from "../../../src/plugin/rules/typed-urls/no-stream-url-fragments.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { connectEventStream } from 'void/sse/client';\nimport { connectLiveStream } from 'void/live/client';\n`;

new RuleTester().run("no-stream-url-fragments", rule, {
  valid: [
    { code: `${head}connectEventStream('/feed');`, filename: "pages/x.tsx" },
    { code: `${head}connectLiveStream('https://api.example.com/live');`, filename: "pages/x.tsx" },
    {
      // Not governed: server code.
      code: `${head}connectEventStream('#feed');`,
      filename: "routes/x.ts",
    },
    {
      // guide/sse.md:150 and guide/live.md:51
      code: `${head}const logs = connectEventStream('/api/logs', { parse: 'text' });\nconst stream = connectLiveStream('/live', {});`,
      filename: "pages/logs.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}connectEventStream('#feed');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "destination" }],
    },
    {
      code: `${head}connectLiveStream('mailto:a@b.c');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "destination" }],
    },
    {
      code: `${head}connectEventStream('ws://localhost/feed');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "destination" }],
    },
  ],
});
