import rule from "../../../src/plugin/rules/typed-urls/link-href-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { Link, useRouter } from '@void/react';\nimport { routeUrl } from 'void/routes';\nconst router = useRouter();\n`;

new RuleTester().run("link-href-shape", rule, {
  valid: [
    { code: `${head}<Link href="/settings">S</Link>;`, filename: "pages/x.tsx" },
    { code: `${head}router.visit('/settings');`, filename: "pages/x.tsx" },
    {
      code: `${head}<Link href={routeUrl('/users/[id]', { params: { id } })}>U</Link>;`,
      filename: "pages/x.tsx",
    },
    {
      // Not governed: an <a> that is not Void's Link.
      code: `${head}<a href="../settings">S</a>;`,
      filename: "pages/x.tsx",
    },
    {
      // guide/type-safety.md:291-294 (React): a template literal is a checked URL string
      code: `${head}<Link href="/about">About</Link>;
<Link href={\`/users/\${user.id}?tab=activity\`}>Profile</Link>;
<Link href={routeUrl('/users/[id]', { params: { id } })}>Profile</Link>;`,
      filename: "pages/x.tsx",
    },
    {
      // A query string appended to a fixed path is not a path parameter.
      code: `${head}router.visit('/search?q=' + term);`,
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}<Link href="../settings">S</Link>;`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "relative" }],
    },
    {
      code: `${head}router.visit('./next');`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "relative" }],
    },
    {
      code: `${head}router.visit('/users/' + id);`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "concat" }],
    },
    {
      code: `${head}<Link href={'/users/' + user.id}>U</Link>;`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "concat" }],
    },
  ],
});
