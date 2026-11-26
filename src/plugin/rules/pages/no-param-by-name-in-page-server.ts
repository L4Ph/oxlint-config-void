import { staticString } from "../../lib/ast.ts";
import { calleeEndsWith } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "`c.req.param('slug')` accepts any name. Read the params object through `PageParams` so a
 * missing or misspelled name is a type error" (guide/type-safety.md:236).
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Read a page's route params as `c.req.param() as PageParams<'/pattern'>`, not by name.",
      norms: ["guide-core/type-safety/11"],
      scope: "void",
    },
    messages: {
      byName:
        "`c.req.param('{{name}}')` accepts any name, so a misspelling is not a type error. Read them all through `PageParams`: `const { {{name}} } = c.req.param() as PageParams<'/pattern'>`, with `PageParams` imported from 'void/routes'. See guide/type-safety.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    return {
      CallExpression(node) {
        if (node.arguments.length !== 1 || !calleeEndsWith(node, "req.param")) return;
        const first = node.arguments[0];
        const name = first && first.type !== "SpreadElement" ? staticString(first) : null;
        context.report({ node, messageId: "byName", data: { name: name ?? "name" } });
      },
    };
  },
});
