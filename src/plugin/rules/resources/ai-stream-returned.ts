import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { methodCall } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Return ai.stream(...) from the route handler instead of serialising it.",
      norms: ["services/ai/11"],
      scope: "void",
    },
    messages: {
      serialised:
        "`ai.stream()` is a streaming Response, and here it is passed to `{{to}}`, which waits for a plain value. Return it from the handler: `return ai.stream(model, input)`. See guide/ai.md.",
      dropped:
        "`{{name}}` holds an `ai.stream()` response that is never used, so nothing streams to the client. Return it from the handler: `return ai.stream(model, input)`. See guide/ai.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "routes" || describe(file).private) return {};
    let bindings: ReturnType<typeof importBindings> | null = null;
    const counts = new Map<string, number>();
    const held: { name: string; node: ESTree.Node }[] = [];
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      Identifier(node) {
        counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
      },
      CallExpression(node) {
        const call = methodCall(node);
        if (call?.[1] !== "stream" || !bindings) return;
        const binding = bindings.get(call[0]);
        if (binding?.source !== "void/ai" || binding.imported !== "ai") return;
        let outer: ESTree.Node = node;
        let parent = (outer as { parent?: ESTree.Node }).parent;
        while (parent?.type === "AwaitExpression" || parent?.type === "ParenthesizedExpression") {
          outer = parent;
          parent = (outer as { parent?: ESTree.Node }).parent;
        }
        if (parent?.type === "CallExpression" && parent.arguments.includes(outer as never)) {
          const to = calleeName(parent);
          if (to === "JSON.stringify" || to?.endsWith(".json"))
            context.report({ node, messageId: "serialised", data: { to } });
        } else if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
          held.push({ name: parent.id.name, node });
        }
      },
      "Program:exit"() {
        for (const { name, node } of held)
          if ((counts.get(name) ?? 0) <= 1)
            context.report({ node, messageId: "dropped", data: { name } });
      },
    };
  },
});
