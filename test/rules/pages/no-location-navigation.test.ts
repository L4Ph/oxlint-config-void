import rule from "../../../src/plugin/rules/pages/no-location-navigation.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-location-navigation", rule, {
  valid: [
    { code: "router.visit('/home');", filename: "pages/a.tsx" },
    { code: "window.location.href = 'https://example.com';", filename: "pages/a.tsx" },
    { code: "window.location.href = '/home';", filename: "src/lib/nav.ts" },
    {
      // An island page has no router: it reloads through window.location (guide/pages-routing/islands.md:209).
      code: "window.location.href = '/home';",
      filename: "pages/blog.island.tsx",
    },
    {
      // guide/pages-routing/overview.md:326-330
      code: `await router.prefetch(profile);
await router.visit(profile);
router.refresh();
router.visit('/logout', { method: 'POST' });`,
      filename: "pages/a.tsx",
    },
  ],
  invalid: [
    {
      code: "window.location.href = '/home';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "location" }],
    },
    {
      code: "location.assign('/home');",
      filename: "pages/a.tsx",
      errors: [{ messageId: "location" }],
    },
    {
      code: "window.location = '/login';",
      filename: "pages/layout.tsx",
      errors: [{ messageId: "location" }],
    },
  ],
});
