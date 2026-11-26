import type { ESTree } from "vite-plus/lint/plugins";
import { defineRule } from "../../rule.ts";

/** The name of the module a `declare module '…'` block above `node` augments, if any. */
function enclosingModule(node: ESTree.Node): string | null {
  for (let current: ESTree.Node | null = node.parent; current; current = current.parent) {
    if (current.type === "TSModuleDeclaration")
      return current.id.type === "Literal" ? String(current.id.value) : null;
  }
  return null;
}

/**
 * reference/api/types.md §CloudContextVariables and guide/type-safety.md §Context
 * Variables: the interface is extended with `declare module 'void' { interface
 * CloudContextVariables { … } }`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Augment CloudContextVariables inside declare module 'void'.",
      norms: ["reference/types/1", "guide-core/type-safety/24"],
      scope: "void",
    },
    messages: {
      module:
        "`CloudContextVariables` is declared {{where}}, so it does not add to Void's interface. Write `declare module 'void' { interface CloudContextVariables { … } }`. See reference/api/types.md (CloudContextVariables).",
    },
    schema: [],
  },
  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        if (node.id.name !== "CloudContextVariables") return;
        const module = enclosingModule(node);
        if (module === "void") return;
        context.report({
          node,
          messageId: "module",
          data: {
            where:
              module === null ? "outside a `declare module`" : `in \`declare module '${module}'\``,
          },
        });
      },
    };
  },
});
