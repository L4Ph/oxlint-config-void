import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, staticString } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import {
  firstParam,
  functionMembers,
  isWsRoute,
  optionsOf,
  walk,
  wsDefinition,
} from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

/**
 * Narrower than the plan: a hook that hands `ctx` or `ctx.request` to a function whose
 * name does not mention cookies is left alone, since that function may check the origin.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Check the `Origin` header in `onBeforeConnect` when it reads cookies from `ctx.request`.",
      norms: ["services/websockets/11"],
      scope: "void",
    },
    messages: {
      cookie:
        "This hook reads cookies from `ctx.request` without looking at the `Origin` header, and a connection from another origin can carry them. Compare `ctx.request.headers.get('origin')` with your site and return a 403 `Response` first. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!isWsRoute(file)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!wsDefinition(node, bindings)) return;
        const hook = functionMembers(optionsOf(node)).get("onBeforeConnect");
        const ctx = hook && firstParam(hook);
        if (!hook || !ctx) return;
        const reads: ESTree.Node[] = [];
        let origin = false;
        let delegated = false;
        const isRequest = (n: ESTree.Node) => calleeName(n) === `${ctx}.request`;
        walk(hook.body, (inner) => {
          if (
            inner.type === "Literal" &&
            typeof inner.value === "string" &&
            inner.value.toLowerCase() === "origin"
          )
            origin = true;
          if (inner.type === "Identifier" && inner.name === "origin") origin = true;
          if (inner.type !== "CallExpression") return;
          const name = calleeName(inner) ?? "";
          const first = inner.arguments[0];
          const arg = first && first.type !== "SpreadElement" ? first : null;
          if (
            name === `${ctx}.request.headers.get` &&
            arg &&
            staticString(arg)?.toLowerCase() === "cookie"
          )
            reads.push(inner);
          else if (
            /cookie/i.test(name) &&
            inner.arguments.some(
              (a) =>
                a.type !== "SpreadElement" &&
                (isRequest(a) || calleeName(a) === `${ctx}.request.headers`),
            )
          )
            reads.push(inner);
          else if (
            inner.arguments.some((a) => (a.type === "Identifier" ? a.name === ctx : isRequest(a)))
          )
            delegated = true;
        });
        if (!origin && !delegated)
          for (const read of reads) context.report({ node: read, messageId: "cookie" });
      },
    };
  },
});
