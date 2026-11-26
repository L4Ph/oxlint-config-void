import { CONVENTION_DIRS, isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const DIRS: readonly string[] = CONVENTION_DIRS;

/**
 * guide/testing.md:18: "Put tests in `tests/` or beside the code they test in `src/`. Keep
 * them out of convention directories such as `routes/` and `pages/`, where Void would treat
 * them as app routes."
 *
 * The docs give two places for a test and name the convention directories as where it does
 * not go. A name that starts with `_` is skipped by Void's router, so a test hidden that way
 * would not become a route, but the docs do not offer that as a third place, and this rule
 * does not either.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep test files out of the convention directories; they go in tests/ or beside code in src/.",
      norms: ["guide-core/testing/2"],
      scope: "void",
    },
    messages: {
      test: "`{{path}}` is a test file inside `{{dir}}/`, a convention directory. Void's docs put tests in `tests/` or beside the code they test in `src/`. Move it there. See guide/testing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !DIRS.includes(file.dir) || !isTestFile(file.name)) return {};
    return {
      Program(node) {
        context.report({ node, messageId: "test", data: { path: file.path, dir: file.dir } });
      },
    };
  },
});
