import { importBindings, isCallOf } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * `revalidate()` from `void/isr` returns a promise; the docs call it with `await`
 * (guide/edge/revalidation.md:128-135).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Await revalidate() from 'void/isr' (or return it) instead of dropping its promise.",
      norms: ["edge-integrations/revalidation/22"],
      scope: "void",
    },
    messages: {
      await:
        "`revalidate()` is called and its promise is dropped, so the handler can finish (and fail to purge) before the cache is cleared. Write `await revalidate(...)` or `return revalidate(...)`. See guide/edge/revalidation.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (file === null) return {};
    const kind = describe(file);
    const governed =
      kind.convention === "routes" ||
      kind.convention === "middleware" ||
      (kind.convention === "pages" && kind.serverCompanion);
    if (!governed) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      ExpressionStatement(node) {
        const call = node.expression;
        if (call.type !== "CallExpression" || call.callee.type !== "Identifier") return;
        if (isCallOf(call, "revalidate", ["void/isr"], bindings))
          context.report({ node, messageId: "await" });
      },
    };
  },
});
