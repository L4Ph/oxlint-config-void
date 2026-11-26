import { scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

/** Global middleware runs in file-name order, so each file starts with a number. */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Start the name of every global middleware file with a number (01.logger.ts).",
      norms: ["guide-core/server-routing/18", "reference/structure/9"],
      scope: "void",
    },
    messages: {
      prefix:
        "`{{name}}` is in `middleware/` without a numeric prefix, so its place in the request chain is not set. Rename it `01.{{name}}` (use 02, 03, ... to order the others). See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = scanned(context, "middleware");
    if (!file || file.segments.length !== 2 || /^\d+\./.test(file.name)) return {};
    return {
      Program(program) {
        context.report({ node: program, messageId: "prefix", data: { name: file.name } });
      },
    };
  },
});
