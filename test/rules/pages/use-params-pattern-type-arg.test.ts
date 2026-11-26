import rule from "../../../src/plugin/rules/pages/use-params-pattern-type-arg.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { useParams } from '@void/react';\n";

new RuleTester().run("use-params-pattern-type-arg", rule, {
  valid: [
    {
      code: IMPORT + "const { id } = useParams<'/users/[id]'>();",
      filename: "pages/users/[id].tsx",
    },
    {
      code: IMPORT + "const params = useParams<'/blog/[slug]'>();",
      filename: "pages/blog/[slug].tsx",
    },
    {
      // A shared component outside pages/ reads any params.
      code: IMPORT + "const p = useParams();",
      filename: "src/components/crumbs.tsx",
    },
    { code: IMPORT + "const p = useParams();", filename: "pages/users/[id].jsx" },
    {
      code: "import { useParams } from './mine';\nconst p = useParams();",
      filename: "pages/a.tsx",
    },
    {
      // guide/pages-routing/overview.md:342-348 (React tab)
      code: `import { useParams } from '@void/react';

export default function PostPage() {
  const { id } = useParams<'/posts/[id]'>(); // { id: string }
  return <h1>Post {id}</h1>;
}`,
      filename: "pages/posts/[id].tsx",
    },
  ],
  invalid: [
    {
      code: IMPORT + "const { id } = useParams();",
      filename: "pages/users/[id].tsx",
      errors: [{ messageId: "pattern" }],
    },
    {
      code: IMPORT + "const p = useParams();",
      filename: "pages/posts/[id].tsx",
      errors: [{ messageId: "pattern" }],
    },
  ],
});
