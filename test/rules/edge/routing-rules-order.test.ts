import rule from "../../../src/plugin/rules/edge/routing-rules-order.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-rules-order", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { redirects: { '/docs/a': '/x', '/docs/*': '/y' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { revalidate: { '/blog/*': 60, '*': 10 } } });",
      filename: "void.config.ts",
    },
    // A spread can hold rules the file does not show, so what follows it is not judged.
    {
      code: "export default defineConfig({ routing: { redirects: { '/docs/*': '/y', ...more, '/docs/a': '/x' } } });",
      filename: "void.config.ts",
    },
    // A host-prefixed source and a path source apply to different requests.
    {
      code: "export default defineConfig({ routing: { redirects: { '/*': '/y', 'https://a.dev/x': '/z' } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { redirects: { '/docs/*': '/y', '/docs/a': '/x' } } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/revalidation.md:30, per-path revalidation, specific patterns first.
      code: `export default defineConfig({
  routing: {
    revalidate: {
      '/': 60,
      '/docs/*': 31536000,
      '/user/*': 0,
      '*': 30,
    },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { redirects: { '/docs/*': '/y', '/docs/a': '/x' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "shadowed" }],
    },
    {
      code: "export default defineConfig({ routing: { revalidate: { '*': 10, '/blog/*': 60 } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "shadowed" }],
    },
    {
      code: "export default defineConfig({ routing: { rewrites: { '/*': '/en', '/docs': '/en/docs' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "shadowed" }],
    },
  ],
});
