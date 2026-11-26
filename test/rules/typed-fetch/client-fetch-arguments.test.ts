import rule from "../../../src/plugin/rules/typed-fetch/client-fetch-arguments.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { fetch } from 'void/client';\n`;

new RuleTester().run("client-fetch-arguments", rule, {
  valid: [
    { code: `${head}await fetch('/users/[id]', { params: { id } });`, filename: "pages/x.tsx" },
    { code: `${head}await fetch('/users');`, filename: "pages/x.tsx" },
    {
      code: `${head}await fetch('/users', { method: 'POST', body: { a: 1 } });`,
      filename: "pages/x.tsx",
    },
    {
      // Not void/client's fetch.
      code: `await fetch('/users/[id]');\nawait fetch(\`/users/\${id}\`);`,
      filename: "pages/x.tsx",
    },
    {
      // A baseURL is another host: the path is not a route pattern.
      code: `${head}await fetch('/v1/items?limit=1', { baseURL: 'https://example.com' });`,
      filename: "pages/x.tsx",
    },
    {
      // guide/typed-fetch.md:14-28 (Basic Usage)
      code: `${head}// GET: return type inferred from your handler
const users = await fetch('/api/users');

// POST: body type-checked against your handler's validator
await fetch('/api/users', {
  method: 'POST',
  body: { name: 'Alice', email: 'alice@example.com' },
});

// Dynamic params interpolated from the route pattern
const user = await fetch('/api/users/[id]', {
  params: { id: '42' },
});`,
      filename: "pages/x.tsx",
    },
    {
      // guide/typed-fetch.md:56-58 (Query Parameters)
      code: `${head}const data = await fetch('/api/search', {\n  query: { q: 'hello' },\n});`,
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}await fetch('/users/[id]');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "params" }],
    },
    {
      code: `${head}await fetch('/users/[id]', { query: { a: 1 } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "params" }],
    },
    {
      code: `${head}await fetch('/users', { body: { a: 1 } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "method" }],
    },
    {
      code: `${head}await fetch<'/users', 'POST'>('/users', {});`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "method" }],
    },
    {
      code: `${head}await fetch(\`/users/\${id}\`);`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "url" }],
    },
    {
      code: `${head}await fetch('/search?q=1');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "url" }],
    },
    {
      code: `${head}await fetch('/users', { method: 'POST', body: JSON.stringify(a), headers: { 'Content-Type': 'application/json' } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "stringify" }, { messageId: "contentType" }],
    },
  ],
});
