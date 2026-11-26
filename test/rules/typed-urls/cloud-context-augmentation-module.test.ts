import rule from "../../../src/plugin/rules/typed-urls/cloud-context-augmentation-module.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("cloud-context-augmentation-module", rule, {
  valid: [
    {
      code: "declare module 'void' { interface CloudContextVariables { requestId: string } }",
      filename: "middleware/01.auth.ts",
    },
    { code: "export {};", filename: "middleware/01.auth.ts" },
    { code: "interface Other { requestId: string }", filename: "src/types.d.ts" },
    {
      // reference/api/types.md:50-55 (CloudContextVariables, augmentation example)
      code: `declare module 'void' {
  interface CloudContextVariables {
    requestId: string;
  }
}`,
      filename: "types/void.d.ts",
    },
    {
      // guide/pages-routing/layouts.md:231-235
      code: `declare module 'void' {
  interface CloudContextVariables {
    shared: { auth: { user: AuthUser | null } };
  }
}`,
      filename: "middleware/01.auth.ts",
    },
  ],
  invalid: [
    {
      code: "interface CloudContextVariables { requestId: string }",
      filename: "middleware/01.auth.ts",
      errors: [{ messageId: "module" }],
    },
    {
      code: "declare module 'void/handler' { interface CloudContextVariables { requestId: string } }",
      filename: "types/void.d.ts",
      errors: [{ messageId: "module" }],
    },
  ],
});
