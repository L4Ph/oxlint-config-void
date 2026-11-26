import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings } from "../../lib/ast.ts";
import {
  RESOURCES,
  defaultExportedFunction,
  isImportReference,
  references,
  rootPath,
  within,
} from "../../lib/frameworks.ts";
import { isTestFile } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * The React Router page: Void's helpers go "in loaders and actions", and server secrets in
 * a `.server.ts` module, because "Void rejects server-secret reads in route files that
 * also contain browser components". The rule looks inside the function the route file
 * default-exports (its component), and follows no call out of it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In React Router, use void/db, void/kv, void/storage, void/ai and server secrets from void/env in loaders and actions, not in the route component.",
      norms: [
        "edge-integrations/frameworks-react-router/3",
        "edge-integrations/frameworks-react-router/7",
      ],
      scope: "framework:react-router",
    },
    messages: {
      helper:
        "`{{name}}` from `{{module}}` is used inside the route component, which also runs in the browser. Read it in the route's `loader` or `action` and return it. See integrations/frameworks/react-router.md.",
      secret:
        "`env.{{name}}` reads a server secret inside the route component, and Void rejects that in a route file that also contains a browser component. Read it in a `.server.ts` module and import that into the loader or action. See integrations/frameworks/react-router.md.",
    },
    schema: [],
  },
  create(context) {
    const path = rootPath(context);
    if (path === null || !path.startsWith("app/routes/")) return {};
    if (/\.server\.[^/]+$/.test(path) || isTestFile(path)) return {};
    return {
      Program(program) {
        const component = defaultExportedFunction(program);
        if (!component) return;
        const bindings = importBindings(program);
        for (const reference of references(context)) {
          const identifier = reference.identifier;
          const binding = bindings.get(identifier.name);
          if (!binding || binding.typeOnly || !isImportReference(reference)) continue;
          if (!within(identifier, component)) continue;
          if ((RESOURCES as readonly string[]).includes(binding.source)) {
            context.report({
              node: identifier,
              messageId: "helper",
              data: { name: identifier.name, module: binding.source },
            });
          } else if (binding.source === "void/env" && binding.imported === "env") {
            const parent = (identifier as unknown as { parent?: ESTree.Node }).parent;
            if (
              parent?.type === "MemberExpression" &&
              parent.object === identifier &&
              !parent.computed &&
              parent.property.type === "Identifier" &&
              !parent.property.name.startsWith("VITE_")
            )
              context.report({
                node: parent,
                messageId: "secret",
                data: { name: parent.property.name },
              });
          }
        }
      },
    };
  },
});
