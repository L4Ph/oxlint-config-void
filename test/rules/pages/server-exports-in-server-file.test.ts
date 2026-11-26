import rule from "../../../src/plugin/rules/pages/server-exports-in-server-file.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("server-exports-in-server-file", rule, {
  valid: [
    { code: "export default function About() { return null; }", filename: "pages/about.tsx" },
    { code: "export const loader = defineHandler(() => ({}));", filename: "pages/about.server.ts" },
    { code: "export const revalidate = 60;", filename: "pages/blog.server.ts" },
    { code: "export const prerender = true;", filename: "src/main.ssr.tsx" },
    { code: "export const revalidate = 60;", filename: "src/lib/cache.ts" },
    { code: "export const loader = 1;", filename: "pages/_components/loader.tsx" },
    {
      // guide/pages-routing/layouts.md:163 : a page component exports `layout`.
      code: "export const layout = 'landing';\n\nexport default function Page() {\n  return <div>This page uses the landing layout</div>;\n}",
      filename: "pages/landing.tsx",
    },
    {
      // guide/edge/prerendering.md:17-20
      code: "export const prerender = true;",
      filename: "pages/about.server.ts",
    },
  ],
  invalid: [
    {
      code: "export const loader = defineHandler(() => ({}));",
      filename: "pages/about.tsx",
      errors: [{ messageId: "component" }],
    },
    {
      code: "export const ssr = false;",
      filename: "pages/about.tsx",
      errors: [{ messageId: "component" }],
    },
    {
      code: "export const revalidate = 60;",
      filename: "routes/blog.ts",
      errors: [{ messageId: "elsewhere" }],
    },
    {
      code: "export const prerender = true;",
      filename: "pages/blog.tsx",
      errors: [{ messageId: "component" }],
    },
  ],
});
