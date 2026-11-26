import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap } from "../../lib/ast.ts";
import {
  RESOURCES,
  defaultExportedFunction,
  isFunction,
  isImportReference,
  references,
} from "../../lib/frameworks.ts";
import { isTestFile } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;
const SERVER_ONLY = new Set(["createServerFn", "createServerOnlyFn", "createMiddleware"]);

/**
 * The TanStack Start page: "Use them in server functions", shown as the `.handler(...)`
 * of `createServerFn()`. The rule looks at files that export a component, and accepts a
 * reference inside a function handed to a `createServerFn`, `createServerOnlyFn` or
 * `createMiddleware` chain, or inside a `server` property (a route's server handlers).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In TanStack Start, use void/db, void/kv, void/storage and void/ai only inside server functions.",
      norms: ["edge-integrations/frameworks-tanstack-start/3"],
      scope: "framework:tanstack-start",
    },
    messages: {
      browser:
        "`{{name}}` from `{{module}}` is used outside a server function, in a file that also ships to the browser. Move the call into `createServerFn().handler(...)` and call that function here. See integrations/frameworks/tanstack-start.md.",
    },
    schema: [],
  },
  create(context) {
    const name = context.filename.split(/[\\/]/).at(-1) ?? "";
    if (/\.server\.[^.]+$/.test(name) || isTestFile(name)) return {};

    return {
      Program(program) {
        if (!exportsComponent(program)) return;
        const bindings = importBindings(program);
        const serverOnly = (call: Node): boolean => {
          let current: Node = call;
          for (;;) {
            if (current.type === "CallExpression") current = current.callee;
            else if (current.type === "MemberExpression") current = current.object;
            else if (unwrap(current) !== current) current = unwrap(current);
            else break;
          }
          const binding = current.type === "Identifier" ? bindings.get(current.name) : undefined;
          return (
            binding !== undefined &&
            binding.source.startsWith("@tanstack/react-start") &&
            SERVER_ONLY.has(binding.imported)
          );
        };
        for (const reference of references(context)) {
          const identifier = reference.identifier;
          const binding = bindings.get(identifier.name);
          if (!binding || binding.typeOnly || !isImportReference(reference)) continue;
          if (!(RESOURCES as readonly string[]).includes(binding.source)) continue;
          let exempt = false;
          let child: Node = identifier;
          for (
            let parent = (child as unknown as { parent?: Node }).parent;
            parent && !exempt;
            child = parent, parent = (parent as unknown as { parent?: Node }).parent
          ) {
            if (
              parent.type === "CallExpression" &&
              isFunction(child) &&
              parent.arguments.includes(child as ESTree.Expression) &&
              serverOnly(parent)
            )
              exempt = true;
            else if (
              parent.type === "Property" &&
              !parent.computed &&
              parent.key.type === "Identifier" &&
              parent.key.name === "server"
            )
              exempt = true;
          }
          if (!exempt)
            context.report({
              node: identifier,
              messageId: "browser",
              data: { name: identifier.name, module: binding.source },
            });
        }
      },
    };
  },
});

/** The file default-exports a function, or exports a function whose name is capitalised. */
function exportsComponent(program: ESTree.Program): boolean {
  if (defaultExportedFunction(program)) return true;
  return program.body.some((statement) => {
    if (statement.type !== "ExportNamedDeclaration") return false;
    const declaration = statement.declaration;
    if (declaration?.type === "FunctionDeclaration")
      return /^[A-Z]/.test(declaration.id?.name ?? "");
    if (declaration?.type !== "VariableDeclaration") return false;
    return declaration.declarations.some((declarator) => {
      const init = declarator.init ? unwrap(declarator.init) : null;
      return (
        declarator.id.type === "Identifier" &&
        /^[A-Z]/.test(declarator.id.name) &&
        init !== null &&
        isFunction(init)
      );
    });
  });
}
