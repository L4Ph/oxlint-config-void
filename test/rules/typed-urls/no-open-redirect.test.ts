import rule from "../../../src/plugin/rules/typed-urls/no-open-redirect.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-open-redirect", rule, {
  valid: [
    {
      code: `const to = c.req.query('redirectTo');\nif (!to?.startsWith('/') || to.startsWith('//')) return c.redirect('/');\nreturn c.redirect(to as Href);`,
      filename: "routes/login.ts",
    },
    { code: `return c.redirect('/home');`, filename: "routes/login.ts" },
    {
      // Not governed: a page component.
      code: `return c.redirect(c.req.query('next'));`,
      filename: "pages/login.tsx",
    },
    {
      // reference/api/rewrites.md:41-44 (c.rewrite): the origin is checked
      code: `const requested = new URL(c.req.query('redirectTo') ?? '/', c.req.url);
return c.redirect(requested.origin === new URL(c.req.url).origin ? requested : '/');`,
      filename: "routes/login.ts",
    },
    {
      // reference/api/rewrites.md:56-60: the header picks a locale, not the target
      code: `export const GET = defineHandler((c) => {
  const locale = c.req.header('accept-language')?.startsWith('de') ? 'de' : 'en';
  return c.rewrite(\`/\${locale}\${new URL(c.req.url).pathname}\`);
});`,
      filename: "middleware/01.locale.ts",
    },
  ],
  invalid: [
    {
      code: `return c.redirect(c.req.query('redirectTo') as Href);`,
      filename: "routes/login.ts",
      errors: [{ messageId: "open" }],
    },
    {
      code: `return c.redirect(c.req.query('next'));`,
      filename: "pages/login.server.ts",
      errors: [{ messageId: "open" }],
    },
    {
      code: `const next = c.req.query('next');\nreturn c.redirect((next ?? '/') as Href);`,
      filename: "routes/login.ts",
      errors: [{ messageId: "open" }],
    },
  ],
});
