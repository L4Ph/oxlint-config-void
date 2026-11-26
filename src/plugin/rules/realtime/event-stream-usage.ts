import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, isCallOf } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { startCallback, walk, walkOwn } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const TIMERS = new Set(["setInterval", "setTimeout"]);
const LISTENERS = new Set(["on", "addEventListener", "addListener"]);

/** True when the callback registers a timer or listener, which fires after the callback returned. */
function schedules(fn: NonNullable<ReturnType<typeof startCallback>>): boolean {
  let found = false;
  walk(fn.body, (node) => {
    if (node.type !== "CallExpression") return;
    const name = calleeName(node)?.split(".").pop() ?? "";
    const method = node.callee.type === "MemberExpression";
    if ((!method && TIMERS.has(name)) || (method && LISTENERS.has(name))) found = true;
  });
  return found;
}

/** True when the callback itself waits on something, or hands a promise back. */
function keepsOpen(fn: NonNullable<ReturnType<typeof startCallback>>): boolean {
  if (fn.body.type !== "BlockStatement") return true; // the expression is its result
  let open = false;
  walkOwn(fn, (node) => {
    if (node.type === "AwaitExpression" || node.type === "YieldExpression") open = true;
    if (node.type === "ForOfStatement" && node.await) open = true;
    if (node.type === "ReturnStatement" && node.argument) open = true;
  });
  return open;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Return `eventStream(...)` from the handler, and make a long-lived start callback await `stream.closed`.",
      norms: ["services/sse/2", "services/sse/3"],
      scope: "void",
    },
    messages: {
      discarded:
        "The `Response` of `eventStream(...)` is {{how}}, so the client never receives the stream. Return it from the handler: `return eventStream(...)`. See guide/sse.md.",
      returns:
        "This `eventStream` callback registers a timer or listener and returns, which closes the stream before it fires. End it with `await stream.closed` (then clear the timer). See guide/sse.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "routes") return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!isCallOf(node, "eventStream", ["void/sse"], bindings)) return;
        const parent = node.parent as ESTree.Node | null;
        if (parent?.type === "ExpressionStatement") {
          context.report({ node, messageId: "discarded", data: { how: "discarded" } });
        } else if (
          parent?.type === "AwaitExpression" &&
          (parent.parent as ESTree.Node | null)?.type === "ExpressionStatement"
        ) {
          context.report({ node, messageId: "discarded", data: { how: "discarded" } });
        } else if (
          parent?.type === "CallExpression" &&
          parent.callee.type === "MemberExpression" &&
          calleeName(parent)?.endsWith(".json")
        ) {
          context.report({ node, messageId: "discarded", data: { how: "serialised by `json()`" } });
        } else if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
          const [variable] = context.sourceCode.getDeclaredVariables(parent);
          if (variable && !variable.references.some((reference) => reference.isRead()))
            context.report({
              node,
              messageId: "discarded",
              data: { how: "assigned and never used" },
            });
        }
        const start = startCallback(node);
        if (start && schedules(start) && !keepsOpen(start))
          context.report({ node: start, messageId: "returns" });
      },
    };
  },
});
