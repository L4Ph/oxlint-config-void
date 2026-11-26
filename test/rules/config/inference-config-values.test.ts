import rule from "../../../src/plugin/rules/config/inference-config-values.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("inference-config-values", rule, {
  valid: [
    {
      code: "export default defineConfig({ inference: { appType: 'spa', outputDir: 'dist', bindings: { db: 'MY_DB', email: true } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ inference: { scanDirs: ['routes', 'lib'] } });",
      filename: "void.config.ts",
    },
    // appType omitted: it is detected on first deploy, so outputDir is not judged.
    {
      code: "export default defineConfig({ inference: { outputDir: 'dist' } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { inference: { appType: 'ssr' } };",
      filename: "other.config.ts",
    },
    {
      // reference/config.md:575, the bindings example.
      code: `export default defineConfig({
  inference: { bindings: { db: true, kv: false, storage: 'MY_BUCKET', ai: 'MY_AI' } },
});`,
      filename: "void.config.ts",
    },
    {
      // guide/app-types.md:70, an app type with a build command.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  inference: {
    appType: 'void',
    build: 'vitepress build && vite build',
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ inference: { appType: 'ssr' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "appType" }],
    },
    {
      code: "export default defineConfig({ inference: { appType: 'void', outputDir: 'dist', bindings: { email: 'E' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "outputDir" }, { messageId: "bindingValue" }],
    },
    {
      code: "export default defineConfig({ inference: { bindings: { queue: true } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "bindingKey" }],
    },
    {
      code: "export default defineConfig({ inference: { bindings: { db: 3 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "bindingValue" }],
    },
    {
      code: "export default defineConfig({ inference: { scanDirs: ['/abs/lib', 'C:\\\\lib'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "scanDir" }, { messageId: "scanDir" }],
    },
  ],
});
