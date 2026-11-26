import rule from "../../../src/plugin/rules/typed-urls/no-any-cast-url.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { Link } from '@void/react';\nimport type { Href } from 'void/routes';\n`;

new RuleTester().run("no-any-cast-url", rule, {
  valid: [
    { code: `${head}c.redirect(cmsUrl as Href);`, filename: "routes/go.ts" },
    { code: `${head}<Link href={u as Href}>x</Link>;`, filename: "pages/x.tsx" },
    {
      // Not a URL position.
      code: `${head}log(cmsUrl as any);`,
      filename: "routes/go.ts",
    },
    {
      // guide/type-safety.md:348-364 (checked URL strings)
      code: `import { routeUrl, type Href } from 'void/routes';

declare const id: string;
declare const dynamic: string;

c.redirect('/about');
c.redirect(routeUrl('/users/[id]', { params: { id } }));
c.redirect({ pathname: '/users/[id]', params: { id } });
c.redirect('https://example.com/login');
c.redirect(new URL('https://example.com/login'));
c.redirect(dynamic as Href);`,
      filename: "routes/go.ts",
    },
  ],
  invalid: [
    {
      code: `${head}c.redirect(cmsUrl as any);`,
      filename: "routes/go.ts",
      errors: [{ messageId: "cast" }],
    },
    {
      code: `${head}<Link href={u as string}>x</Link>;`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "cast" }],
    },
  ],
});
