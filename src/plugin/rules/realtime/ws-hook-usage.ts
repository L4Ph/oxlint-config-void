import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import {
  firstParam,
  functionMembers,
  isWsRoute,
  optionsOf,
  walk,
  wsDefinition,
} from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

/**
 * Narrower than the plan: `ctx.request.url` is not reported. The page says the request
 * in `onMessage` and `onClose` has no headers, cookies or query, not that its URL is empty.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not close the socket again in `onClose`, or read request headers or cookies in `onMessage` and `onClose`.",
      norms: ["services/websockets/24", "services/websockets/25"],
      scope: "void",
    },
    messages: {
      close:
        "Void completes the close handshake itself, so `{{call}}` in `onClose` closes a socket that is already closing. Use `onClose` for cleanup only. See guide/websockets.md.",
      request:
        "In `{{hook}}`, `ctx.request` is a placeholder without {{what}}. Save what you need in `onConnect` with `ctx.connection.setState()` (`ctx.socket.setState()` in `defineWebSocket`) and read it from the state. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!isWsRoute(file)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!wsDefinition(node, bindings)) return;
        const hooks = functionMembers(optionsOf(node));
        for (const hook of ["onMessage", "onClose"]) {
          const fn = hooks.get(hook);
          const ctx = fn && firstParam(fn);
          if (!fn || !ctx) continue;
          walk(fn.body, (inner: ESTree.Node) => {
            const text =
              inner.type === "CallExpression" || inner.type === "MemberExpression"
                ? calleeName(inner)
                : null;
            if (
              hook === "onClose" &&
              inner.type === "CallExpression" &&
              (text === `${ctx}.connection.close` || text === `${ctx}.socket.close`)
            )
              context.report({ node: inner, messageId: "close", data: { call: `${text}()` } });
            if (
              inner.type === "MemberExpression" &&
              (text === `${ctx}.request.headers` || text === `${ctx}.request.cookies`)
            )
              context.report({
                node: inner,
                messageId: "request",
                data: { hook, what: text.endsWith("headers") ? "headers" : "cookies" },
              });
          });
        }
      },
    };
  },
});
