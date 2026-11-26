import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap, type ImportBinding } from "../../lib/ast.ts";
import { handlerFunction, returnedValues } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * "Functions and custom class instances can't be sent as page data"
 * (guide/pages-routing/loaders.md:32). The linter gives a plugin no type information
 * (`parserServices` is an empty record), so only what the syntax shows is checked: a
 * function in the returned object literal, and `new C()` of a class declared in the file.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not return functions or custom class instances from a loader.",
      norms: ["pages-routing/loaders/5"],
      scope: "void",
    },
    messages: {
      function:
        "A loader cannot send a function to the page. Return the data and call the function in the component, or in the loader before returning. See guide/pages-routing/loaders.md.",
      instance:
        "`{{name}}` is a class of this file, and Void cannot send a custom class instance as page data. Return a plain object with the fields the page needs. See guide/pages-routing/loaders.md.",
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
        const bindings: Map<string, ImportBinding> = importBindings(program);
        const classes = new Set<string>();
        for (const statement of program.body) {
          const declaration =
            statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          if (declaration?.type === "ClassDeclaration" && declaration.id)
            classes.add(declaration.id.name);
        }
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
              const object = unwrap(value as Node);
              if (object.type !== "ObjectExpression") continue;
              for (const member of object.properties) {
                if (member.type !== "Property") continue;
                const entry = unwrap(member.value as Node);
                if (entry.type === "ArrowFunctionExpression" || entry.type === "FunctionExpression")
                  context.report({ node: member, messageId: "function" });
                else if (
                  entry.type === "NewExpression" &&
                  entry.callee.type === "Identifier" &&
                  classes.has(entry.callee.name)
                )
                  context.report({
                    node: entry,
                    messageId: "instance",
                    data: { name: entry.callee.name },
                  });
              }
            }
          }
        }
      },
    };
  },
});
