import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { isWsRoute } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const SENDERS = /^[A-Za-z_$][\w$]*\.(?:room\.broadcast|connection\.send|socket\.send)$/;
const BINARY = new Set([
  "ArrayBuffer",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int8Array",
  "DataView",
  "Blob",
]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Send WebSocket messages as JSON events, not raw strings or binary.",
      norms: ["services/websockets/9"],
      scope: "void",
    },
    messages: {
      raw: "WebSocket messages are JSON events, and raw strings and binary are not supported. Send an object that matches `messages.server`, such as `{ type: 'chat.message', text }`. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isWsRoute(locate(context))) return {};
    return {
      CallExpression(node) {
        const name = calleeName(node);
        const first = node.arguments[0];
        if (!name || !SENDERS.test(name) || !first || first.type === "SpreadElement") return;
        const raw =
          (first.type === "Literal" && typeof first.value === "string") ||
          first.type === "TemplateLiteral" ||
          (first.type === "NewExpression" &&
            first.callee.type === "Identifier" &&
            BINARY.has(first.callee.name));
        if (raw) context.report({ node: first as ESTree.Node, messageId: "raw" });
      },
    };
  },
});
