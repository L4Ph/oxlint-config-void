import rule from "../../../src/plugin/rules/config/typed-routes-enabled.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("typed-routes-enabled", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { typedRoutes: true } });",
      filename: "void.config.ts",
    },
    { code: "export default defineConfig({ ...base });", filename: "void.config.ts" },
    {
      code: "export default defineConfig({ routing: { ...base } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default defineConfig({});", filename: "vite.config.ts" },
    {
      // guide/type-safety.md:277, the existing-app example.
      code: `// void.config.ts
import { defineConfig } from 'void/config';

export default defineConfig({
  routing: { typedRoutes: true },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({});",
      filename: "void.config.ts",
      errors: [{ messageId: "typedRoutes" }],
    },
    {
      code: "export default defineConfig({ routing: { typedRoutes: false } });",
      filename: "void.config.ts",
      errors: [{ messageId: "typedRoutes" }],
    },
    {
      code: "export default defineConfig({ routing: { revalidate: 60 } });",
      filename: "void.config.ts",
      errors: [{ messageId: "typedRoutes" }],
    },
  ],
});
