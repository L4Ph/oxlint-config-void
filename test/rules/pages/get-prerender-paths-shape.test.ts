import rule from "../../../src/plugin/rules/pages/get-prerender-paths-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("get-prerender-paths-shape", rule, {
  valid: [
    {
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/blog/[slug]'>[]> { return []; }",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      // Custom SSR returns full paths; it is not a page file.
      code: "export async function getPrerenderPaths(): Promise<string[]> { return []; }",
      filename: "src/main.ssr.ts",
    },
    { code: "export const prerender = true;", filename: "pages/about.server.ts" },
    {
      // A plain JavaScript companion has no annotation to give.
      code: "export async function getPrerenderPaths() { return [{ slug: 'hello' }]; }",
      filename: "pages/blog/[slug].server.js",
    },
    {
      code: "export const getPrerenderPaths = async (): Promise<PageParams<'/blog/[slug]'>[]> => [{ slug: 'hello' }, { slug: 7 }];",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      // Built by a query: the annotation makes tsc check it.
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/blog/[slug]'>[]> { return posts.map((p) => ({ slug: p.slug })); }",
      filename: "pages/blog/[slug].server.ts",
    },
    {
      // guide/ssg.md:62: a value containing `/` goes to a catch-all page.
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/docs/[...slug]'>[]> { return [{ slug: 'guides/intro' }]; }",
      filename: "pages/docs/[...slug].server.ts",
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
      code: "export async function getPrerenderPaths() { return []; }",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "annotation" }],
    },
    {
      code: "export const getPrerenderPaths = async (): Promise<string[]> => [];",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "annotation" }],
    },
    {
      code: "export async function getPrerenderPaths() { return []; }",
      filename: "pages/about.server.ts",
      errors: [{ messageId: "unneeded" }],
    },
    {
      code: "export const getPrerenderPaths = async () => [];",
      filename: "pages/blog/index.server.ts",
      errors: [{ messageId: "unneeded" }],
    },
    {
      code: "export const getPrerenderPaths = async (): Promise<PageParams<'/blog/[slug]'>[]> => [{ id: 'hello' }];",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "missingParam" }, { messageId: "unknownParam" }],
    },
    {
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/blog/[slug]'>[]> { return [{}]; }",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "missingParam" }],
    },
    {
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/docs/[slug]'>[]> { return [{ slug: 'guides/intro' }]; }",
      filename: "pages/docs/[slug].server.ts",
      errors: [{ messageId: "slash" }],
    },
    {
      code: "export async function getPrerenderPaths(): Promise<PageParams<'/blog/[slug]'>[]> { return [{ slug: true }]; }",
      filename: "pages/blog/[slug].server.ts",
      errors: [{ messageId: "badValue" }],
    },
  ],
});
