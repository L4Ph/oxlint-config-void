import rule from "../../../src/plugin/rules/resources/kv-put-arguments.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { kv } from 'void/kv';\n";

new RuleTester().run("kv-put-arguments", rule, {
  valid: [
    { code: head + "await kv.put('k', { a: 1 });", filename: "routes/a.ts" },
    { code: head + "await kv.put('k', 'text');", filename: "routes/a.ts" },
    {
      code: head + "await kv.put('k', v, { expiration: Math.floor(Date.now() / 1000) + 60 });",
      filename: "routes/a.ts",
    },
    { code: head + "await kv.put('k', v, { ttl: 3600 });", filename: "routes/a.ts" },
    // Another object named kv is not ours.
    { code: "await kv.put('k', JSON.stringify(v));", filename: "routes/a.ts" },
    // guide/kv.md:21-35
    {
      code:
        head +
        `await kv.put('user:123', { name: 'Alice', role: 'admin' });
await kv.put('session:abc', sessionData, { ttl: 3600 });
await kv.put('token:xyz', tokenData, { expiration: 1700000000 });
const sessions = kv.map<Session>('sessions');
await sessions.put('abc', { userId: 1, token: '...' }, { ttl: 3600 });`,
      filename: "routes/a.ts",
    },
  ],
  invalid: [
    {
      code: head + "await kv.put('k', JSON.stringify({ a: 1 }));",
      filename: "routes/a.ts",
      errors: [{ messageId: "stringified" }],
    },
    {
      code: head + "const users = kv.map('users');\nawait users.put('k', JSON.stringify(u));",
      filename: "routes/a.ts",
      errors: [{ messageId: "stringified" }],
    },
    {
      code: head + "await kv.put('k', v, { expiration: Date.now() + 60000 });",
      filename: "routes/a.ts",
      errors: [{ messageId: "expiration" }],
    },
    {
      code: head + "await kv.put('k', v, { ttl: 60 * 1000 });",
      filename: "routes/a.ts",
      errors: [{ messageId: "ttl" }],
    },
  ],
});
