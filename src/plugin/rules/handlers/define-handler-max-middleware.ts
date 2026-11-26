import { importBindings } from "../../lib/ast.ts";
import { defineHandlerNames, isCallTo } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/server-routing.md:281 and reference/api/handlers.md:30: `defineHandler` composes up
 * to 5 middleware before the handler, so a call has at most 6 arguments.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass at most five middleware, then the handler, to defineHandler.",
      norms: ["reference/handlers/2", "guide-core/server-routing/25"],
      scope: "void",
    },
    messages: {
      tooMany:
        "`defineHandler` takes up to 5 middleware before the handler, but this call passes {{middleware}}. Combine some middleware into one `defineMiddleware`, or move them to `middleware/`. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const names = new Set<string>();
    return {
      Program(program) {
        for (const name of defineHandlerNames(importBindings(program))) names.add(name);
      },
      CallExpression(node) {
        if (names.size === 0 || !isCallTo(node, names)) return;
        if (node.arguments.some((arg) => arg.type === "SpreadElement")) return;
        if (node.arguments.length > 6)
          context.report({
            node,
            messageId: "tooMany",
            data: { middleware: String(node.arguments.length - 1) },
          });
      },
    };
  },
});
