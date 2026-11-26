import rule from "../../../src/plugin/rules/typed-fetch/client-fetch-no-json-call.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { fetch } from 'void/client';\n`;

new RuleTester().run("client-fetch-no-json-call", rule, {
  valid: [
    { code: `${head}const users = await fetch('/users');`, filename: "pages/x.tsx" },
    {
      code: `${head}const u = await fetch('/users', { query: { a: 1 } });`,
      filename: "pages/x.tsx",
    },
    {
      // The global fetch returns a Response: .json() is right there.
      code: `const r = await fetch('/x');\nconst d = await r.json();`,
      filename: "pages/x.tsx",
    },
    {
      // guide/typed-fetch.md:16 and reference/api/client.md:18-21
      code: `${head}const users = await fetch('/api/users');\nconst user = await fetch('/api/users/[id]', {\n  params: { id: '1' },\n});`,
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}const users = await (await fetch('/users')).json();`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "json" }],
    },
    {
      code: `${head}const r = await fetch('/users');\nconst d = await r.json();`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "json" }],
    },
    {
      code: `${head}const d = await fetch('/users').then((r) => r.json());`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "json" }],
    },
  ],
});
