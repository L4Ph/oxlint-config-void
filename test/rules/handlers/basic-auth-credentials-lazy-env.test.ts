import rule from "../../../src/plugin/rules/handlers/basic-auth-credentials-lazy-env.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { basicAuth } from 'void';\nimport { env } from 'void/env';\n";

new RuleTester().run("basic-auth-credentials-lazy-env", rule, {
  valid: [
    {
      code: `${head}export default basicAuth({ username: () => env.GATE_USER, password: () => env.GATE_PASS });`,
      filename: "middleware/01.gate.ts",
    },
    {
      code: `${head}export default basicAuth({ username: () => env.U, password: () => env.P, realm: () => 'Staging' });`,
      filename: "middleware/01.gate.ts",
    },
    // A file the rule does not govern: basicAuth is not Void's.
    {
      code: "import { basicAuth } from 'hono/basic-auth';\nexport default basicAuth({ username: 'a', password: 'b' });",
      filename: "src/other.ts",
    },
    {
      // guide/server-routing.md:243-251 (credentials through callbacks, a literal realm).
      code: `${head}export default basicAuth({\n  username: () => env.BASIC_AUTH_USERNAME,\n  password: () => env.BASIC_AUTH_PASSWORD,\n  realm: 'Preview',\n});`,
      filename: "middleware/01.basic-auth.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export default basicAuth({ username: 'admin', password: 'hunter2' });`,
      filename: "middleware/01.gate.ts",
      errors: [{ messageId: "literal" }, { messageId: "literal" }],
    },
    {
      code: `${head}export default basicAuth({ username: env.GATE_USER, password: env.GATE_PASS });`,
      filename: "middleware/01.gate.ts",
      errors: [{ messageId: "eager" }, { messageId: "eager" }],
    },
  ],
});
