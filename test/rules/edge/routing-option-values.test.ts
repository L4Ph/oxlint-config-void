import rule from "../../../src/plugin/rules/edge/routing-option-values.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-option-values", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { revalidate: 60 } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { revalidate: { '/blog/*': 300 } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { prerender: ['/', '/about'] } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { prerender: ['/pricing'] } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { notFound: '404-page' } });",
      filename: "void.config.ts",
    },
    // A value computed elsewhere is not judged.
    {
      code: "export default defineConfig({ routing: { revalidate: ttl, prerender: paths } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { revalidate: '60s', notFound: '404' } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/revalidation.md:30, per-path revalidation.
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
    {
      // guide/edge/static-assets.md:84, a static site with a 404 page.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  routing: { notFound: '404-page' },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { revalidate: '60s' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "revalidate" }],
    },
    {
      code: "export default defineConfig({ routing: { revalidate: { '/a': '1h' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "revalidate" }],
    },
    {
      code: "export default defineConfig({ routing: { prerender: ['about'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "prerenderPath" }],
    },
    {
      code: "export default defineConfig({ routing: { prerender: 'all' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "prerenderShape" }],
    },
    {
      code: "export default defineConfig({ routing: { notFound: '404' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "notFound" }],
    },
  ],
});
