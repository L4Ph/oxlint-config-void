import rule from "../../../src/plugin/rules/edge/routing-fallbacks-spa-index.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-fallbacks-spa-index", rule, {
  valid: [
    {
      code: "export default defineConfig({ inference: { appType: 'spa' }, routing: { fallbacks: { '/app/*': '/app' } } });",
      filename: "void.config.ts",
    },
    // Without the app type in the file the rule stays silent.
    {
      code: "export default defineConfig({ routing: { fallbacks: { '/*': '/index.html' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ inference: { appType: 'void' }, routing: { fallbacks: { '/*': '/index.html' } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { inference: { appType: 'spa' }, routing: { fallbacks: { '/*': '/index.html' } } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/rewrites.md:84, the fallback example for an app that is not an SPA.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  routing: {
    fallbacks: { '/*': '/index.html' },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ inference: { appType: 'spa' }, routing: { fallbacks: { '/*': '/index.html' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "spa" }],
    },
    {
      code: "export default defineConfig({ inference: { appType: 'spa' }, routing: { fallbacks: { '/*': '/index.html', '/a': '/b' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "spa" }],
    },
    {
      code: "export default defineConfig({ routing: { fallbacks: { '/*': '/index.html' } } });",
      filename: "void.config.ts",
      settings: { void: { appType: "spa" } },
      errors: [{ messageId: "spa" }],
    },
  ],
});
