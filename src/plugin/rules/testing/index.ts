import type { VoidRule } from "../../rule.ts";
import noTestInRouteDirs from "./no-test-in-route-dirs.ts";

export const rules: Record<string, VoidRule> = {
  "no-test-in-route-dirs": noTestInRouteDirs,
};
