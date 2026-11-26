import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, unwrap } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/** Calls `visit` for every node below `node`, in source order. */
function walk(node: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (node === null || typeof node !== "object" || typeof (node as Node).type !== "string") return;
  visit(node as Node);
  for (const [key, value] of Object.entries(node)) if (key !== "parent") walk(value, visit);
}

/**
 * Void acknowledges a queue message when the handler returns and retries it when the handler
 * throws. A `catch` that neither throws nor decides about the messages hides the error and
 * acknowledges them.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "A catch in a queue consumer rethrows or retries, so a failed message is not acknowledged.",
      norms: ["services/queues/8"],
      scope: "void",
    },
    messages: {
      swallowed:
        "This `catch` neither rethrows nor calls `retry()`/`retryAll()`, so Void acknowledges the message as if it had succeeded. Rethrow the error, or call `msg.retry()` (or `batch.retryAll()`). See guide/queues.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "queues") return {};
    const kind = describe(file);
    if (kind.private) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      ExportDefaultDeclaration(node) {
        const call = unwrap(node.declaration as Node);
        if (call.type !== "CallExpression") return;
        const callee = call.callee;
        if (callee.type !== "Identifier") return;
        const binding = bindings.get(callee.name);
        if (binding?.imported !== "defineQueue" || binding.source !== "void") return;
        walk(call.arguments, (inner) => {
          if (inner.type !== "CatchClause") return;
          let decides = false;
          walk(inner.body, (n) => {
            if (n.type === "ThrowStatement") decides = true;
            // An explicit ack() in the catch is a decision too.
            if (n.type === "CallExpression") {
              const name = calleeName(n)?.split(".").pop();
              if (name === "retry" || name === "retryAll" || name === "ack" || name === "ackAll")
                decides = true;
            }
          });
          if (!decides) context.report({ node: inner, messageId: "swallowed" });
        });
      },
    };
  },
});
