import rule from "../../../src/plugin/rules/pages/ssr-entry-prerender-paths.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("ssr-entry-prerender-paths", rule, {
  valid: [
    {
      code: "export async function getPrerenderPaths(): Promise<string[]> { return ['/a', '/b']; }",
      filename: "src/main.ssr.tsx",
    },
    { code: "export const prerender = true;", filename: "src/main.ssr.tsx" },
    {
      // A page companion is governed by get-prerender-paths-shape.
      code: "async function getPrerenderPaths() { return [{ slug: 'a' }]; }",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      // guide/edge/prerendering.md:48-53
      code: `export const prerender = true;

export async function getPrerenderPaths(): Promise<string[]> {
  return ['/', '/about', '/blog/hello-world'];
}`,
      filename: "src/main.ssr.ts",
    },
  ],
  invalid: [
    {
      code: "async function getPrerenderPaths() { return ['/a']; }",
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "notExported" }],
    },
    {
      code: "export async function getPrerenderPaths() { return [{ slug: 'a' }]; }",
      filename: "src/main.ssr.tsx",
      errors: [{ messageId: "objects" }],
    },
    {
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/a/[b]'>[]> { return []; }",
      filename: "src/main.ssr.ts",
      errors: [{ messageId: "objects" }],
    },
  ],
});
