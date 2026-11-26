import type { VoidRule } from "../../rule.ts";
import emailTestHarness from "./email-test-harness.ts";
import noTestInRouteDirs from "./no-test-in-route-dirs.ts";
import vitePlusTestImport from "./vite-plus-test-import.ts";

export const rules: Record<string, VoidRule> = {
  "email-test-harness": emailTestHarness,
  "no-test-in-route-dirs": noTestInRouteDirs,
  "vite-plus-test-import": vitePlusTestImport,
};
