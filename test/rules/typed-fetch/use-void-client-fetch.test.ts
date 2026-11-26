import rule from "../../../src/plugin/rules/typed-fetch/use-void-client-fetch.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("use-void-client-fetch", rule, {
  valid: [
    {
      code: `import { fetch } from 'void/client';\nawait fetch('/api/users');`,
      filename: "pages/x.tsx",
    },
    { code: `await fetch('https://example.com/x');`, filename: "pages/x.tsx" },
    { code: `await fetch('/api/auth/get-session');`, filename: "pages/x.tsx" },
    { code: `await fetch('/api/report.csv');`, filename: "pages/_lib/export.ts" },
    {
      // Not governed: server code.
      code: `await fetch('/api/users');`,
      filename: "routes/proxy.ts",
    },
    {
      // guide/quickstart.md:95 (the docs call it through void/client)
      code: `import { fetch } from 'void/client';\nconst { message } = await fetch('/api/hello');`,
      filename: "pages/index.tsx",
    },
  ],
  invalid: [
    {
      code: `await fetch('/api/users');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "global" }],
    },
    {
      code: "await fetch(`/api/users/${id}`);",
      filename: "pages/_features/users.ts",
      errors: [{ messageId: "global" }],
    },
  ],
});
