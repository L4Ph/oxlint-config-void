import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { ancestors, hasCatchChain, inTryBlock } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

const SERVER_DIRS = ["routes", "middleware", "queues", "crons", "email", "durable-objects"];

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Catch the UsageLimit and StreamError that fetchStream() throws.",
      norms: ["services/ai/12"],
      scope: "void",
    },
    messages: {
      uncaught:
        "`fetchStream()` throws `UsageLimit` and `StreamError`, and this call is not in a try block and has no `.catch()`. Catch the error to stop the generating state, keep the partial output and offer a retry. See guide/ai.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (file) {
      const kind = describe(file);
      if (SERVER_DIRS.includes(file.dir) || kind.serverCompanion) return {};
    }
    let bindings: ReturnType<typeof importBindings> | null = null;
    const refs = new Map<string, ESTree.Node[]>();
    const held: { name: string; node: ESTree.Node }[] = [];
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      Identifier(node) {
        const list = refs.get(node.name) ?? [];
        list.push(node);
        refs.set(node.name, list);
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !bindings) return;
        const binding = bindings.get(node.callee.name);
        if (binding?.source !== "void/client" || binding.imported !== "fetchStream") return;
        if (inTryBlock(node) || hasCatchChain(node)) return;
        const parent = (node as { parent?: ESTree.Node }).parent;
        // shortcut: a stored stream is judged when it is never used or only iterated outside a try; passing it on is not followed.
        if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier")
          held.push({ name: parent.id.name, node });
        else context.report({ node, messageId: "uncaught" });
      },
      "Program:exit"() {
        for (const { name, node } of held) {
          const others = (refs.get(name) ?? []).filter(
            (ref) => ref !== node && !isDeclared(ref, node),
          );
          if (others.every((ref) => isBareIteration(ref) && !inTryBlock(ref)))
            context.report({ node, messageId: "uncaught" });
        }
      },
    };
  },
});

function isDeclared(ref: ESTree.Node, call: ESTree.Node): boolean {
  const declarator = (call as { parent?: ESTree.Node }).parent;
  return declarator?.type === "VariableDeclarator" && declarator.id === ref;
}

function isBareIteration(ref: ESTree.Node): boolean {
  const parent = ancestors(ref)[0];
  return parent?.type === "ForOfStatement" && parent.right === ref;
}
