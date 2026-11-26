import rule from "../../../src/plugin/rules/convention-files/route-no-default-export.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("route-no-default-export", rule, {
  valid: [
    { code: "export const GET = defineHandler(() => []);", filename: "routes/users.ts" },
    { code: "export const POST = defineHandler(() => ({}));", filename: "routes/users.ts" },
    { code: "export default defineRoom({});", filename: "routes/chat.ws.ts" },
    { code: "export default function Page() {}", filename: "pages/about.tsx" },
    { code: "export default {};", filename: "routes/_helpers.ts" },
    // guide/server-routing.md line 55 (named HTTP method constants)
    {
      code: `import { defineHandler } from 'void';\n\nexport const GET = defineHandler((c) => {\n  return { message: 'Hello!', timestamp: Date.now() };\n});`,
      filename: "routes/api/hello.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineHandler(() => []);",
      filename: "routes/users.ts",
      errors: [{ messageId: "default" }],
    },
    {
      code: "export const get = defineHandler(() => []);",
      filename: "routes/users.ts",
      errors: [{ messageId: "lowercase" }],
    },
    {
      code: "const h = 1;\nexport { h as default };",
      filename: "routes/users.ts",
      errors: [{ messageId: "default" }],
    },
  ],
});
