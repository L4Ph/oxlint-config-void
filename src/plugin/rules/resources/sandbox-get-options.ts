import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const MAX_TIMEOUT_MS = 6 * 60 * 60 * 1000;

/** The value of an expression made only of number literals and `+ - * /`; null otherwise. */
function evaluate(node: Node): number | null {
  const value = unwrap(node);
  if (value.type === "Literal" && typeof value.value === "number") return value.value;
  if (value.type !== "BinaryExpression") return null;
  const left = evaluate(value.left as Node);
  const right = evaluate(value.right);
  if (left === null || right === null) return null;
  switch (value.operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    default:
      return null;
  }
}

/** `getSandbox(id, options)`: an id of 1-63 characters, and at most six hours of inactivity. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give getSandbox() an id of 1-63 characters and an inactivityTimeoutMs of at most six hours.",
      norms: ["services/sandboxes/2", "services/sandboxes/10"],
      scope: "void",
    },
    messages: {
      id: "The sandbox id has {{length}} characters; an id contains 1-63 characters. Shorten it, or derive a short id from the long one. See guide/sandboxes.md.",
      timeout:
        "`inactivityTimeoutMs` is {{value}} ms; the maximum is six hours (21600000 ms). Use a smaller value. See guide/sandboxes.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier") return;
        const binding = bindings.get(callee.name);
        if (binding?.imported !== "getSandbox" || binding.source !== "void/sandbox") return;
        const [id, options] = node.arguments;
        if (id && id.type !== "SpreadElement") {
          const text = staticString(id);
          if (text !== null && (text.length === 0 || text.length > 63))
            context.report({ node: id, messageId: "id", data: { length: String(text.length) } });
        }
        if (options && options.type !== "SpreadElement") {
          const member = property(unwrap(options), "inactivityTimeoutMs");
          const value = member ? evaluate(member.value) : null;
          if (member && value !== null && value > MAX_TIMEOUT_MS)
            context.report({
              node: member.value,
              messageId: "timeout",
              data: { value: String(value) },
            });
        }
      },
    };
  },
});
