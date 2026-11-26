import rule from "../../../src/plugin/rules/markdown/use-frontmatter-from-void-md.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("use-frontmatter-from-void-md", rule, {
  valid: [
    { code: "import { useFrontmatter } from '@void/md';", filename: "pages/layout.tsx" },
    { code: "const fm = useFrontmatter();", filename: "pages/layout.tsx" },
    {
      // A module of the app may re-export it.
      code: "import { useFrontmatter } from './md';",
      filename: "pages/layout.tsx",
    },
    { code: "import { setFrontmatter } from './mine';", filename: "pages/layout.tsx" },
    { code: "import pages from '@void/md/pages';", filename: "pages/layout.tsx" },
    {
      // guide/pages-routing/markdown.md:175-186 (React tab)
      code: `import { useFrontmatter } from '@void/md';

export default function DocsLayout({ children }) {
  const fm = useFrontmatter();
  return (
    <div>
      <h1>{fm.title}</h1>
      {children}
    </div>
  );
}`,
      filename: "pages/docs/layout.tsx",
    },
  ],
  invalid: [
    {
      code: "import { useFrontmatter } from '@void/md/plugin';",
      filename: "pages/layout.tsx",
      errors: [{ messageId: "source" }],
    },
    {
      code: "import { setFrontmatter } from '@void/md';",
      filename: "pages/layout.tsx",
      errors: [{ messageId: "deprecated" }],
    },
    {
      code: "import { FrontmatterContext, useFrontmatter } from '@void/md';",
      filename: "pages/layout.tsx",
      errors: [{ messageId: "deprecated" }],
    },
  ],
});
