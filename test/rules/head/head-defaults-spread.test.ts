import rule from "../../../src/plugin/rules/head/head-defaults-spread.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("head-defaults-spread", rule, {
  valid: [
    {
      code: "c.set('headDefaults', { ...c.get('headDefaults'), titleTemplate: '%s | Admin' });",
      filename: "middleware/admin.ts",
    },
    // A first middleware sets the whole value, and reads none.
    {
      code: "c.set('headDefaults', { titleTemplate: '%s | A' });",
      filename: "middleware/01.head.ts",
    },
    {
      code: "const d = c.get('headDefaults');\nc.set('headDefaults', { ...d, titleTemplate: 'x %s' });",
      filename: "middleware/02.head.ts",
    },
    // Not a middleware file.
    {
      code: "const d = c.get('headDefaults');\nc.set('headDefaults', { titleTemplate: 'x' });",
      filename: "src/helper.ts",
    },
    {
      // guide/pages-routing/head.md, lines 86-94 (Middleware defaults)
      code: `import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  if (c.req.path.startsWith('/admin')) {
    c.set('headDefaults', { ...c.get('headDefaults'), titleTemplate: '%s | Admin' });
  }
  await next();
});`,
      filename: "middleware/admin.ts",
    },
    {
      // guide/pages-routing/head.md, lines 67-80 (Middleware defaults, theme script)
      code: `import { defineMiddleware } from 'void';

export default defineMiddleware(async (c, next) => {
  c.set('headDefaults', {
    script: [
      {
        innerHTML: \`const t = localStorage.getItem("theme");
        if (t) document.documentElement.dataset.theme = t;\`,
      },
    ],
  });
  await next();
});`,
      filename: "middleware/01.head.ts",
    },
  ],
  invalid: [
    {
      code: "const d = c.get('headDefaults');\nc.set('headDefaults', { titleTemplate: 'x' });",
      filename: "middleware/03.admin.ts",
      errors: [{ messageId: "spread" }],
    },
    {
      code: "if (c.get('headDefaults')) c.set('headDefaults', { titleTemplate: '%s | Admin' });",
      filename: "middleware/admin.ts",
      errors: [{ messageId: "spread" }],
    },
  ],
});
