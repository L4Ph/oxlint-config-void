import rule from "../../../src/plugin/rules/head/title-template-value.ts";
import { RuleTester } from "../../rule-tester.ts";

const define = "import { defineHead } from 'void';\n";

new RuleTester().run("title-template-value", rule, {
  valid: [
    {
      code: `${define}export const head = defineHead(() => ({ titleTemplate: '%s | Blog' }));`,
      filename: "pages/a.server.ts",
    },
    { code: "c.set('headDefaults', { titleTemplate: '' });", filename: "middleware/admin.ts" },
    {
      // guide/pages-routing/head.md, line 99 (the empty template drops the suffix)
      code: "c.set('headDefaults', { ...c.get('headDefaults'), titleTemplate: '' });",
      filename: "middleware/admin.ts",
    },
    {
      code: "export default defineConfig({ head: { titleTemplate: '%s | A' } });",
      filename: "void.config.ts",
    },
    // `titleTemplate` of an unrelated object is not the head's.
    { code: "export const x = { titleTemplate: 'Blog' };", filename: "pages/a.server.ts" },
    { code: "export default { head: { titleTemplate: 'Site' } };", filename: "vite.config.ts" },
    {
      // guide/pages-routing/head.md, lines 89-94 (Middleware defaults)
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
      // reference/config.md, line 205 (head.titleTemplate in void.config.ts)
      code: "import { defineConfig } from 'void/config';\nexport default defineConfig({ head: { titleTemplate: '%s | My Site' } });",
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: `${define}export const head = defineHead(() => ({ titleTemplate: 'Blog' }));`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "export default defineConfig({ head: { titleTemplate: 'Site' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "placeholder" }],
    },
    {
      code: "c.set('headDefaults', { titleTemplate: null });",
      filename: "middleware/admin.ts",
      errors: [{ messageId: "empty" }],
    },
    {
      code: `${define}export const head = defineHead(() => ({ titleTemplate: false }));`,
      filename: "pages/a.server.ts",
      errors: [{ messageId: "empty" }],
    },
  ],
});
