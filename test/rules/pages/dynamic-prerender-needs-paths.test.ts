import rule from "../../../src/plugin/rules/pages/dynamic-prerender-needs-paths.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("dynamic-prerender-needs-paths", rule, {
  valid: [
    {
      code: "export const prerender = true;\nexport async function getPrerenderPaths() { return []; }",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      code: "export const loader = defineHandler(() => ({}));",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      // A page with no dynamic segment needs no paths.
      code: "export const prerender = true;",
      filename: "pages/about.server.ts",
    },
    {
      code: "export const prerender = true;",
      filename: "src/main.ssr.ts",
    },
    {
      // guide/edge/prerendering.md:28-37
      code: `import type { PageParams } from 'void/routes';

export const prerender = true;

export async function getPrerenderPaths(): Promise<PageParams<'/blog/[slug]'>[]> {
  return [{ slug: 'hello-world' }, { slug: 'getting-started' }];
}`,
      filename: "pages/blog/[slug].server.ts",
    },
  ],
  invalid: [
    {
      code: "export const prerender = true;",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export const prerender = true;\nexport const loader = defineHandler(() => ({}));",
      filename: "pages/docs/[...slug].server.ts",
      errors: [{ messageId: "missing" }],
    },
  ],
});
