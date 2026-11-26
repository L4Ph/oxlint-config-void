import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, unwrap } from "../../lib/ast.ts";
import { functionMembers, optionsOf, returned } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const COMPARISONS = new Set(["==", "===", "!=", "!==", "<", "<=", ">", ">=", "in", "instanceof"]);

/** True for a value that is certainly not a `Response` and not nothing: a boolean, null, string or number. */
function isVerdict(node: ESTree.Node): boolean {
  const value = unwrap(node);
  if (value.type === "Literal") return true;
  if (value.type === "TemplateLiteral") return true;
  if (value.type === "UnaryExpression") return value.operator === "!";
  return value.type === "BinaryExpression" && COMPARISONS.has(value.operator);
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Reject in `onSubscribe` and `onBeforeConnect` by returning a `Response`, and accept by returning nothing.",
      norms: ["services/live/17", "services/websockets/23"],
      scope: "void",
    },
    messages: {
      verdict:
        "`{{hook}}` rejects by returning a `Response` and accepts by returning nothing, so a returned `{{what}}` does not do what it looks like. Return `new Response('Forbidden', { status: 403 })` to reject, and `return;` to allow. See {{page}}.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        const live = isCallOf(node, "defineLiveStream", ["void/live"], bindings);
        const ws =
          isCallOf(node, "defineRoom", ["void/ws"], bindings) ||
          isCallOf(node, "defineWebSocket", ["void/ws"], bindings);
        if (!live && !ws) return;
        const hook = live ? "onSubscribe" : "onBeforeConnect";
        const fn = functionMembers(optionsOf(node)).get(hook);
        if (!fn) return;
        for (const value of returned(fn))
          if (isVerdict(value))
            context.report({
              node: value,
              messageId: "verdict",
              data: {
                hook,
                what: context.sourceCode.getText(value),
                page: live ? "guide/live.md" : "guide/websockets.md",
              },
            });
      },
    };
  },
});
