import rule from "../../../src/plugin/rules/testing/no-test-in-convention-dirs.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-test-in-convention-dirs", rule, {
  valid: [
    { code: "export {};", filename: "tests/pages/about.test.ts" },
    {
      // guide/testing.md:40: the docs' own test sits beside the code in src/.
      code: "import { expect, it, vi } from 'vite-plus/test';\nimport { countVisit } from './visits';\nit('counts', async () => { expect(await countVisit()).toBe(1); });\nvoid vi;",
      filename: "src/visits.test.ts",
    },
    { code: "export {};", filename: "pages/about.tsx" },
    { code: "export {};", filename: "routes/_works/read.ts" },
  ],
  invalid: [
    { code: "export {};", filename: "pages/about.test.tsx", errors: [{ messageId: "test" }] },
    { code: "export {};", filename: "routes/api/users.spec.ts", errors: [{ messageId: "test" }] },
    // Hidden from the router by `_`, and still not where the docs put a test.
    { code: "export {};", filename: "pages/_about.test.tsx", errors: [{ messageId: "test" }] },
    {
      code: "export {};",
      filename: "pages/_components/button.test.tsx",
      errors: [{ messageId: "test" }],
    },
    { code: "export {};", filename: "routes/_works/read.test.ts", errors: [{ messageId: "test" }] },
    {
      code: "export {};",
      filename: "middleware/01.session.test.ts",
      errors: [{ messageId: "test" }],
    },
  ],
});
