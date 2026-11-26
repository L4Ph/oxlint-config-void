import { RuleTester } from "vite-plus/lint/plugins-dev";
import { describe, it } from "vite-plus/test";

// RuleTester reports each case through the test runner it is handed.
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export { RuleTester };
