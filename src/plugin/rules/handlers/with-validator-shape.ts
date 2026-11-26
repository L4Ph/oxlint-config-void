import { importBindings } from "../../lib/ast.ts";
import { defineHandlerNames, walk } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

const SLOTS = new Set(["body", "query", "params"]);
/** Exports Void reads as handlers: a bare `withValidator(...)` there can never be called. */
const HANDLER_EXPORTS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "action",
  "loader",
]);

/**
 * reference/api/handlers.md:36-78: `defineHandler.withValidator(validators)` takes one object
 * with the slots `body`, `query` and `params`, and "returns a curried function that accepts
 * the handler".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call defineHandler.withValidator with only body, query and params, then call the result with the handler.",
      norms: ["reference/handlers/4", "reference/handlers/6"],
      scope: "void",
    },
    messages: {
      extraArgument:
        "`defineHandler.withValidator` takes only the validators object; the handler goes in a second call: `defineHandler.withValidator({ body })((c, { body }) => …)`. See reference/api/handlers.md.",
      notCalled:
        "`defineHandler.withValidator(...)` returns a function that still needs the handler, so this export is not a handler. Call the result with the handler: `defineHandler.withValidator({ body })((c, { body }) => …)`. See reference/api/handlers.md.",
      unknownSlot:
        "`{{key}}` is not a validator slot. `withValidator` accepts `body`, `query` and `params`. See reference/api/handlers.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const names = defineHandlerNames(importBindings(program));
        if (names.size === 0) return;
        const parents = new Map<unknown, unknown>();
        walk(program, (node, parent) => {
          parents.set(node, parent);
          if (node.type !== "CallExpression") return;
          const callee = node.callee;
          if (
            callee.type !== "MemberExpression" ||
            callee.computed ||
            callee.object.type !== "Identifier" ||
            !names.has(callee.object.name) ||
            callee.property.type !== "Identifier" ||
            callee.property.name !== "withValidator"
          )
            return;
          const slots = node.arguments[0];
          if (slots?.type === "ObjectExpression")
            for (const member of slots.properties) {
              if (member.type !== "Property" || member.computed) continue;
              const key =
                member.key.type === "Identifier"
                  ? member.key.name
                  : member.key.type === "Literal"
                    ? String(member.key.value)
                    : null;
              if (key !== null && !SLOTS.has(key))
                context.report({ node: member.key, messageId: "unknownSlot", data: { key } });
            }
          if (node.arguments.length >= 2) {
            context.report({ node, messageId: "extraArgument" });
            return;
          }
          if (!isLeftUncalled(parent, parents)) return;
          context.report({ node, messageId: "notCalled" });
        });
      },
    };
  },
});

/** True where the validated builder is the whole value of a handler export or a bare statement. */
function isLeftUncalled(parent: unknown, parents: Map<unknown, unknown>): boolean {
  const p = parent as { type: string; callee?: unknown; id?: { type: string; name: string } };
  if (p.type === "ExpressionStatement" || p.type === "ExportDefaultDeclaration") return true;
  if (p.type !== "VariableDeclarator" || p.id?.type !== "Identifier") return false;
  if (!HANDLER_EXPORTS.has(p.id.name)) return false;
  const declaration = parents.get(p) as { type: string } | undefined;
  const exported = declaration && (parents.get(declaration) as { type: string } | undefined);
  return exported?.type === "ExportNamedDeclaration";
}
