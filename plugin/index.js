import noTestInRouteDirs from "./rules/no-test-in-route-dirs.js";

/** The `void` plugin: one rule per thing Void's documentation asks of an app that a lint can check. */
export default {
  meta: { name: "void" },
  rules: {
    "no-test-in-route-dirs": noTestInRouteDirs,
  },
};
