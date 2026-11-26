import rule from "../../../src/plugin/rules/edge/routing-rewrite-paths.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-rewrite-paths", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { rewrites: { '/docs/*': '/guide/:splat' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { fallbacks: { '/app/*': '/app' } } });",
      filename: "void.config.ts",
    },
    // A `*` source without :splat is legal.
    {
      code: "export default defineConfig({ routing: { rewrites: { '/old/*': '/new' } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { rewrites: { '/a': 'https://x.dev/b' } } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/rewrites.md:15, the rewrites example.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  routing: {
    rewrites: {
      '/': '/en',
      '/docs': '/en/docs',
      '/docs/*': '/en/docs/:splat',
    },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { rewrites: { '/a': 'https://x.dev/b' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "path" }],
    },
    {
      code: "export default defineConfig({ routing: { rewrites: { '/a': '/b/:splat' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "splat" }],
    },
    {
      code: "export default defineConfig({ routing: { fallbacks: { 'app/*': '//x.dev' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "path" }, { messageId: "path" }],
    },
  ],
});
