import type { VoidRule } from "../../rule.ts";
import emailTestHarness from "./email-test-harness.ts";
import noTestInConventionDirs from "./no-test-in-convention-dirs.ts";
import vitePlusTestImport from "./vite-plus-test-import.ts";

export const rules: Record<string, VoidRule> = {
  "email-test-harness": emailTestHarness,
  "no-test-in-convention-dirs": noTestInConventionDirs,
  "vite-plus-test-import": vitePlusTestImport,
};
