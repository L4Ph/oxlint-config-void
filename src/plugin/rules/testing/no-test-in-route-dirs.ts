import { isPrivate, isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * A test file in `routes/` or `pages/` is a route to Void: it scans those directories and
 * serves what it finds. A name that starts with `_` (the file's or a directory's) is
 * skipped by the scan, so a test beside a page is `_<page>.test.tsx`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep test files out of routes/ and pages/, where Void would serve them.",
      norms: ["guide-core/testing/2"],
      scope: "void",
    },
    messages: {
      test: "`{{path}}` is a test file inside `{{dir}}/`, where Void treats every file as a route. Move it to `tests/` or `src/`, or give it (or a directory above it) a name that starts with `_`.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || (file.dir !== "routes" && file.dir !== "pages")) return {};
    if (!isTestFile(file.name) || isPrivate(file.segments)) return {};
    return {
      Program(node) {
        context.report({ node, messageId: "test", data: { path: file.path, dir: file.dir } });
      },
    };
  },
});
