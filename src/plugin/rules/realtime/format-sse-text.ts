import type { ESTree } from "vite-plus/lint/plugins";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/** The text of a literal or template, with `${}` holes left out; null for other nodes. */
function frame(node: ESTree.Node): string | null {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral")
    return node.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
  return null;
}

function isFrame(node: ESTree.Node): boolean {
  const text = frame(node);
  if (text === null || !/^(?:data|event):/.test(text) || !text.includes("\n\n")) return false;
  // a template starts with its first quasi, not with a hole
  return (
    node.type !== "TemplateLiteral" || /^(?:data|event):/.test(node.quasis[0]?.value.cooked ?? "")
  );
}

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Frame an already serialised payload with `formatSseText()`, not by hand.",
      norms: ["services/sse/6"],
      scope: "void",
    },
    messages: {
      frame:
        "This writes an SSE frame by hand. Use `formatSseText({ event, data })` from `void/sse` for a payload you have already serialised, or `eventStream()` to stream events. See guide/sse.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "routes") return {};
    const check = (node: ESTree.Node) => {
      if (isFrame(node)) context.report({ node, messageId: "frame" });
    };
    return {
      // `return "data: …\n\n"` and `() => "data: …\n\n"`
      ReturnStatement(node) {
        if (node.argument) check(node.argument);
      },
      ArrowFunctionExpression(node) {
        if (node.body.type !== "BlockStatement") check(node.body);
      },
      // `new Response("data: …\n\n", …)`
      NewExpression(node) {
        const first = node.arguments[0];
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "Response" &&
          first &&
          first.type !== "SpreadElement"
        )
          check(first);
      },
    };
  },
});
