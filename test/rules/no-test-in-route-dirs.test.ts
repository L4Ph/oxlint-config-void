import rule from "../../src/plugin/rules/no-test-in-route-dirs.ts";
import { RuleTester } from "../rule-tester.ts";

new RuleTester().run("no-test-in-route-dirs", rule, {
  valid: [
    { code: "export {};", filename: "tests/pages/about.test.ts" },
    { code: "export {};", filename: "src/visits.test.ts" },
    { code: "export {};", filename: "pages/_about.test.tsx" },
    { code: "export {};", filename: "pages/_components/button.test.tsx" },
    { code: "export {};", filename: "routes/_works/read.test.ts" },
    { code: "export {};", filename: "pages/about.tsx" },
  ],
  invalid: [
    { code: "export {};", filename: "pages/about.test.tsx", errors: [{ messageId: "test" }] },
    { code: "export {};", filename: "routes/api/users.spec.ts", errors: [{ messageId: "test" }] },
  ],
});
