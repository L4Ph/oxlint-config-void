import rule from "../../../src/plugin/rules/pages/set-preserves-shared.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineHandler } from 'void';\n";

new RuleTester().run("set-preserves-shared", rule, {
  valid: [
    {
      code:
        IMPORT +
        "export const action = defineHandler((c) => { c.set('shared', { ...c.get('shared'), auth: { user } }); });",
      filename: "pages/a.server.ts",
    },
    {
      code: IMPORT + "export const action = defineHandler((c) => { c.set('other', {}); });",
      filename: "pages/a.server.ts",
    },
    {
      // Middleware sets the starting value (guide/pages-routing/layouts.md:239).
      code:
        IMPORT +
        "export default defineMiddleware(async (c, next) => { c.set('shared', { auth: { user } }); await next(); });",
      filename: "middleware/01.auth.ts",
    },
    {
      // guide/pages-routing/layouts.md:250-255
      code: `import { defineHandler } from 'void';

export const action = defineHandler(async (c) => {
  const user = await updateProfile(c);
  c.set('shared', { ...c.get('shared'), auth: { user } });
});`,
      filename: "pages/profile.server.ts",
    },
  ],
  invalid: [
    {
      code:
        IMPORT +
        "export const action = defineHandler((c) => { c.set('shared', { auth: { user } }); });",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "spread" }],
    },
    {
      code:
        IMPORT +
        "export const loader = defineHandler((c) => { c.set('shared', { flash }); return {}; });",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "spread" }],
    },
  ],
});
