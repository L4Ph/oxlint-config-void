import rule from "../../../src/plugin/rules/edge/routing-redirects-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("routing-redirects-shape", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { redirects: { '/old/*': '/new/:splat' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { redirects: { 'https://old.dev/*': 'https://new.dev/:splat' } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { redirects: { '/a': { to: '/b', status: 301 } } } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ routing: { redirects: { '/a': '/b' } } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { redirects: { old: '/new' } } };",
      filename: "other.config.ts",
    },
    {
      // guide/edge/redirects.md:11, the redirects example.
      code: `export default defineConfig({
  routing: {
    redirects: {
      '/old': '/new',
      '/blog/*': { to: '/posts/:splat', status: 301 },
    },
  },
});`,
      filename: "void.config.ts",
    },
    {
      // guide/edge/redirects.md:36, domain-level redirects.
      code: `export default defineConfig({
  routing: {
    redirects: {
      'https://www.example.com/*': 'https://example.com/:splat',
      'https://old-marketing.com/*': 'https://example.com/:splat',
    },
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { redirects: { old: '/new' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "source" }],
    },
    {
      code: "export default defineConfig({ routing: { redirects: { 'http://old.dev/*': '/new' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "insecure" }],
    },
    {
      code: "export default defineConfig({ routing: { redirects: { 'https://*.example.com/*': '/new' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "host" }],
    },
    {
      code: "export default defineConfig({ routing: { redirects: { '/old': '/new/:splat' } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "splat" }],
    },
    {
      code: "export default defineConfig({ routing: { redirects: { '/a': { to: '/b', status: 304 } } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "status" }],
    },
    {
      code: "export default defineConfig({ routing: { redirects: { '/a': { status: 301 } } } });",
      filename: "void.config.ts",
      errors: [{ messageId: "missingTo" }],
    },
  ],
});
