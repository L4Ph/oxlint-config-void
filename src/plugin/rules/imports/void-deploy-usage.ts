import { importBindings } from "../../lib/ast.ts";
import { isFunction, localNames, moduleSpecifiers, walk } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/api/deploy.md:7 and :63: "Use `void/deploy` from Node.js to prepare a built Void
 * app", and "Dispose the result after publication."
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use void/deploy only in Node.js tooling, and dispose what prepareCfBuildOutput returns.",
      norms: ["reference/deploy/1", "reference/deploy/10"],
      scope: "void",
    },
    messages: {
      runtime:
        "`void/deploy` runs in Node.js to prepare a build, not inside the app. Move this import to a script outside `routes/`, `pages/` and the other app directories. See reference/api/deploy.md.",
      dispose:
        "`{{name}}` is never disposed. Call `await {{name}}.dispose()` after publication, in a `finally` block so it runs when publishing fails. See reference/api/deploy.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    const kind = file ? describe(file) : null;
    const inApp =
      kind !== null && kind.convention !== null && kind.convention !== "db" && !kind.test;
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program))
          if (inApp && node.value === "void/deploy") context.report({ node, messageId: "runtime" });
        const prepare = localNames(importBindings(program), "prepareCfBuildOutput", [
          "void/deploy",
        ]);
        if (prepare.size === 0) return;
        const scopes: Parameters<typeof walk>[0][] = [program];
        walk(program, (node) => {
          if (isFunction(node)) scopes.push(node);
        });
        const declared: {
          name: string;
          node: Parameters<typeof walk>[0];
          scope: Parameters<typeof walk>[0];
        }[] = [];
        for (const scope of scopes)
          walk(scope, (node) => {
            // A nested function is its own scope.
            if (node !== scope && isFunction(node)) return false;
            if (node.type !== "VariableDeclarator" || node.id.type !== "Identifier") return;
            const init = node.init;
            const call = init?.type === "AwaitExpression" ? init.argument : init;
            if (
              call?.type === "CallExpression" &&
              call.callee.type === "Identifier" &&
              prepare.has(call.callee.name)
            )
              declared.push({ name: node.id.name, node, scope });
          });
        for (const { name, node, scope } of declared) {
          let handled = false;
          walk(scope, (inner) => {
            if (
              inner.type === "MemberExpression" &&
              inner.object.type === "Identifier" &&
              inner.object.name === name &&
              inner.property.type === "Identifier" &&
              inner.property.name === "dispose"
            )
              handled = true;
            // Handing the result back passes the duty to dispose to the caller.
            if (
              inner.type === "ReturnStatement" &&
              inner.argument?.type === "Identifier" &&
              inner.argument.name === name
            )
              handled = true;
          });
          if (!handled) context.report({ node, messageId: "dispose", data: { name } });
        }
      },
    };
  },
});
