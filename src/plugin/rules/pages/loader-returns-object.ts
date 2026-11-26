import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap } from "../../lib/ast.ts";
import { handlerFunction, returnedValues } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/** "`loader` ... returns an object that becomes the page's props" (guide/pages-routing/loaders.md:12). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "A loader returns an object, not an array or a primitive.",
      norms: ["pages-routing/loaders/2"],
      scope: "void",
    },
    messages: {
      notObject:
        "A loader's result becomes the page's props, so it must be an object. Return `{ items: [...] }` instead of an array or a primitive. See guide/pages-routing/loaders.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    return {
      Program(program) {
        const bindings = importBindings(program);
        for (const statement of program.body) {
          if (statement.type !== "ExportNamedDeclaration") continue;
          const declaration = statement.declaration;
          if (declaration?.type !== "VariableDeclaration") continue;
          for (const declarator of declaration.declarations) {
            if (
              declarator.id.type !== "Identifier" ||
              declarator.id.name !== "loader" ||
              !declarator.init
            )
              continue;
            const handler = handlerFunction(declarator.init, bindings);
            if (!handler) continue;
            for (const value of returnedValues(handler)) {
              const result = unwrap(value as Node);
              if (
                result.type === "ArrayExpression" ||
                result.type === "TemplateLiteral" ||
                (result.type === "Literal" && result.value !== null)
              )
                context.report({ node: result, messageId: "notObject" });
            }
          }
        }
      },
    };
  },
});
