import { unwrap } from "../../lib/ast.ts";
import { scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

const OPTIONS = ["maxBatchSize", "maxBatchTimeout", "maxConcurrency", "maxRetries", "retryDelay"];

function wholeNumber(init: ESTree.Node | null): number | null {
  const value = init && unwrap(init);
  return value?.type === "Literal" &&
    typeof value.value === "number" &&
    Number.isInteger(value.value) &&
    value.value >= 0
    ? value.value
    : null;
}

/**
 * Void reads the queue options from the file itself, so each is `export const name = <whole
 * number>`. `export * from` is not reported: it cannot be told whether it carries an option.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export each queue option as a whole-number literal in the queue file, with maxConcurrency from 1 to 250.",
      norms: ["services/queues/12", "services/queues/13", "services/queues/11"],
      scope: "void",
    },
    messages: {
      literal:
        "`{{name}}` must be exported as a whole-number literal in this file, such as `export const {{name}} = 5;`. Computed values and re-exports are not supported; repeat shared settings in each queue file. See guide/queues.md.",
      range:
        "`maxConcurrency` is {{value}}, but Cloudflare accepts 1 to 250. Use a value in that range, or remove the export to let Cloudflare scale automatically. See guide/queues.md.",
    },
    schema: [],
  },
  create(context) {
    if (!scanned(context, "queues")) return {};
    return {
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          const name =
            specifier.exported.type === "Identifier"
              ? specifier.exported.name
              : String(specifier.exported.value);
          const renamed = specifier.local.type === "Identifier" && specifier.local.name !== name;
          if (OPTIONS.includes(name) && (node.source || renamed))
            context.report({ node: specifier, messageId: "literal", data: { name } });
        }
        const declaration = node.declaration;
        if (declaration?.type === "FunctionDeclaration" && declaration.id) {
          if (OPTIONS.includes(declaration.id.name))
            context.report({
              node: declaration,
              messageId: "literal",
              data: { name: declaration.id.name },
            });
        } else if (declaration?.type === "VariableDeclaration") {
          for (const declarator of declaration.declarations) {
            if (declarator.id.type !== "Identifier" || !OPTIONS.includes(declarator.id.name))
              continue;
            const name = declarator.id.name;
            const number = wholeNumber(declarator.init);
            if (number === null)
              context.report({ node: declarator, messageId: "literal", data: { name } });
            else if (name === "maxConcurrency" && (number < 1 || number > 250))
              context.report({
                node: declarator.init as ESTree.Node,
                messageId: "range",
                data: { value: String(number) },
              });
          }
        }
      },
    };
  },
});
