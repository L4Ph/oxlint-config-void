import rule from "../../../src/plugin/rules/head/no-browser-api-in-head.ts";
import { RuleTester } from "../../rule-tester.ts";

const define = "import { defineHead } from 'void';\n";

new RuleTester().run("no-browser-api-in-head", rule, {
  valid: [
    {
      code: `${define}export const head = defineHead(() => ({ title: 'A' }));`,
      filename: "pages/a.server.ts",
    },
    {
      code: `${define}export const head = defineHead((c) => ({ title: c.req.path }));`,
      filename: "pages/a.server.ts",
    },
    // Outside head(), the loader may use what it likes of its own scope.
    {
      code: `${define}const t = document.title;\nexport const head = defineHead(() => ({ title: 'A' }));`,
      filename: "pages/a.server.ts",
    },
    // A local named `document`, and the `typeof` guard, touch no global.
    {
      code: `${define}export const head = defineHead((c, { document }) => ({ title: typeof window === 'undefined' ? document.title : '' }));`,
      filename: "pages/a.server.ts",
    },
    // Not a page's .server file.
    { code: "export const head = () => ({ title: document.title });", filename: "src/head.ts" },
    {
      // guide/pages-routing/head.md, lines 29-38 (Page titles and metadata)
      code: `import { defineHandler, defineHead } from 'void';
export const head = defineHead<Props>((c, props) => {
  return {
    title: props.post.title,
    meta: [
      { name: 'description', content: props.post.excerpt },
      { property: 'og:title', content: props.post.title },
    ],
  };
});`,
      filename: "pages/posts/[slug].server.ts",
    },
  ],
  invalid: [
    {
      code: `${define}export const head = defineHead(() => ({ title: document.title }));`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "browser" }],
    },
    {
      code: `${define}export const head = defineHead(() => ({ title: localStorage.getItem('t') }));`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "browser" }],
    },
    {
      code: "export function head() { return { title: navigator.userAgent }; }",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "browser" }],
    },
  ],
});
