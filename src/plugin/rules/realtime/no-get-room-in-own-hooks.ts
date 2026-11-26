import { defaultExport, importBindings, isCallOf, staticString } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { functionMembers, isWsRoute, optionsOf, walk } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const HOOKS = ["onBeforeConnect", "onConnect", "onMessage", "onClose", "onRequest"];

/** `routes/chat/[room].ws.ts` is the route `/chat/[room]`, the pattern `getRoom()` takes. */
function routePattern(path: string): string {
  const parts = path
    .replace(/^routes\//, "")
    .replace(/(?:\.(?:dev|prod))?\.ws\.[cm]?[jt]sx?$/, "")
    .split("/")
    .filter((part) => part !== "index" && !/^\(.*\)$/.test(part));
  return `/${parts.join("/")}`;
}

/**
 * Narrower than the plan: only a `getRoom('<this file's own route>', ...)` call is
 * reported. Calling another room from a hook is fine, and a pattern that is computed
 * cannot be compared, so neither is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Use `ctx.room`, not `getRoom()`, in a room's own hooks.",
      norms: ["services/websockets/21"],
      scope: "void",
    },
    messages: {
      self: "`getRoom('{{pattern}}')` addresses the room this hook runs in, and a call from inside the room waits on the room itself. Use `ctx.room` here. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isWsRoute(file)) return {};
    const pattern = routePattern(file.path);
    return {
      Program(program) {
        const bindings = importBindings(program);
        const exported = defaultExport(program)?.value;
        if (
          !exported ||
          exported.type !== "CallExpression" ||
          !isCallOf(exported, "defineRoom", ["void/ws"], bindings)
        )
          return;
        for (const name of HOOKS) {
          const hook = functionMembers(optionsOf(exported)).get(name);
          if (!hook) continue;
          walk(hook.body, (node) => {
            if (
              node.type !== "CallExpression" ||
              !isCallOf(node, "getRoom", ["void/ws/server"], bindings)
            )
              return;
            const first = node.arguments[0];
            if (first && first.type !== "SpreadElement" && staticString(first) === pattern)
              context.report({ node, messageId: "self", data: { pattern } });
          });
        }
      },
    };
  },
});
