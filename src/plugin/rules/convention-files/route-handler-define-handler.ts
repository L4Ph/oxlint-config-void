import { importBindings, isCallOf, topLevelConst, unwrap } from "../../lib/ast.ts";
import { HTTP_METHODS, isFunctionNode, scanned, VOID_SOURCES } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

/**
 * Each exported HTTP-method handler is built with `defineHandler`. Only a bare function is
 * reported; a call of anything else (a local factory, an import) may well return one.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Build each exported HTTP-method handler in routes/ with defineHandler (or defineHandler.withValidator(...)).",
      norms: ["reference/handlers/1", "guide-core/quickstart/4", "cli/generate/9"],
      scope: "void",
    },
    messages: {
      bare: "`{{name}}` is a bare function. Wrap it: `export const {{name}} = defineHandler((c) => { ... })`, with `defineHandler` imported from `void`. See reference/api/handlers.md.",
    },
    schema: [],
  },
  create(context) {
    const file = scanned(context, "routes");
    if (!file || /\.ws\.[^.]+$/.test(file.name) || file.segments.some((s) => s.startsWith(".")))
      return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        const bare = (node: ESTree.Node | null): boolean => {
          if (!node) return false;
          const value = unwrap(node);
          if (isCallOf(value, "defineHandler", VOID_SOURCES, bindings)) return false;
          return isFunctionNode(value);
        };
        for (const statement of program.body) {
          if (statement.type !== "ExportNamedDeclaration" || statement.exportKind === "type")
            continue;
          const declaration = statement.declaration;
          if (declaration?.type === "FunctionDeclaration" && declaration.id) {
            if (HTTP_METHODS.includes(declaration.id.name))
              context.report({
                node: declaration,
                messageId: "bare",
                data: { name: declaration.id.name },
              });
          } else if (declaration?.type === "VariableDeclaration") {
            for (const declarator of declaration.declarations)
              if (
                declarator.id.type === "Identifier" &&
                HTTP_METHODS.includes(declarator.id.name) &&
                bare(declarator.init)
              )
                context.report({
                  node: declarator,
                  messageId: "bare",
                  data: { name: declarator.id.name },
                });
          } else if (!statement.source) {
            for (const specifier of statement.specifiers) {
              const name =
                specifier.exported.type === "Identifier"
                  ? specifier.exported.name
                  : String(specifier.exported.value);
              if (!HTTP_METHODS.includes(name) || specifier.local.type !== "Identifier") continue;
              const local = specifier.local.name;
              const declared = program.body.find(
                (s) => s.type === "FunctionDeclaration" && s.id?.name === local,
              );
              if (declared || bare(topLevelConst(program, local)))
                context.report({ node: specifier, messageId: "bare", data: { name } });
            }
          }
        }
      },
    };
  },
});
