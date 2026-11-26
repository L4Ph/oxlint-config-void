import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/config/scandirs-keep-defaults.ts";
import { RuleTester } from "../../rule-tester.ts";

// The rule reads the directory beside void.config.ts, so these configs sit in fixture apps.
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const both = fixture("routes-pages/void.config.ts");
const routes = fixture("routes-only/void.config.ts");
const bare = fixture("bare/void.config.ts");

new RuleTester().run("scandirs-keep-defaults", rule, {
  valid: [
    {
      code: "export default defineConfig({ inference: { scanDirs: ['routes', 'lib'] } });",
      filename: routes,
    },
    {
      code: "export default defineConfig({ inference: { scanDirs: ['routes', 'pages', 'lib'] } });",
      filename: both,
    },
    { code: "export default defineConfig({});", filename: both },
    // Written the way the paths are relative to the project root.
    {
      code: "export default defineConfig({ inference: { scanDirs: ['./routes/', 'pages', 'lib'] } });",
      filename: both,
    },
    // Not a Void config file.
    {
      code: "export default { inference: { scanDirs: ['lib'] } };",
      filename: fixture("routes-pages/other.config.ts"),
    },
    {
      // guide/live.md and reference/resource-inference.md:77, the custom scan directories example:
      // an app with none of the default directories on disk.
      code: `export default defineConfig({
  inference: {
    scanDirs: ['src', 'lib', 'workers'],
  },
});`,
      filename: bare,
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ inference: { scanDirs: ['lib'] } });",
      filename: both,
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default defineConfig({ inference: { scanDirs: ['pages'] } });",
      filename: routes,
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default defineConfig({ inference: { scanDirs: ['src', 'lib', 'workers'] } });",
      filename: both,
      errors: [{ messageId: "missing" }],
    },
  ],
});
