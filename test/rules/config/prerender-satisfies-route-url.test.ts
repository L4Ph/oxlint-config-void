import rule from "../../../src/plugin/rules/config/prerender-satisfies-route-url.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("prerender-satisfies-route-url", rule, {
  valid: [
    {
      code: "export default defineConfig({ routing: { typedRoutes: true, prerender: ['/'] satisfies RouteUrl[] } });",
      filename: "void.config.ts",
    },
    { code: "export default defineConfig({});", filename: "void.config.ts" },
    // Typed routes are off, so there is nothing to check the paths against.
    {
      code: "export default defineConfig({ routing: { prerender: ['/', '/about'] } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    {
      code: "export default { routing: { typedRoutes: true, prerender: ['/'] } };",
      filename: "other.config.ts",
    },
    {
      // reference/config.md:545, the annotated array (with typedRoutes on, as the line above it says).
      code: `import type { RouteUrl } from 'void/routes';

export default defineConfig({
  routing: {
    typedRoutes: true,
    prerender: ['/', '/about', '/pricing'] satisfies RouteUrl[],
  },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ routing: { typedRoutes: true, prerender: ['/'] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "satisfies" }],
    },
    {
      code: "export default defineConfig({ routing: { typedRoutes: true, prerender: ['/', '/about'] satisfies string[] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "satisfies" }],
    },
  ],
});
