import type { VoidRule } from "./rule.ts";
import noTestInRouteDirs from "./rules/no-test-in-route-dirs.ts";

/** One rule per thing Void's documentation asks of an app that a lint can check. */
export const rules: Record<string, VoidRule> = {
  "no-test-in-route-dirs": noTestInRouteDirs,
};

/** The `void` plugin. */
export default { meta: { name: "void" }, rules };
