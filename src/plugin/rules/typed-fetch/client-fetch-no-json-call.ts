import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf } from "../../lib/ast.ts";
import { initOf, isFunction, memberName, strip, variableOf } from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/api/client.md §Differences from native fetch: `fetch` from `void/client`
 * returns `Promise<T>`, "which auto-parses JSON and returns the typed result directly",
 * so there is no Response to call `.json()` on.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not call .json() on the result of void/client fetch; it is already parsed.",
      norms: ["reference/client/5"],
      scope: "void",
    },
    messages: {
      json: "`fetch` from `void/client` returns the parsed body, not a Response, so there is no `.json()`. Use the awaited value directly. See reference/api/client.md (Differences from native fetch).",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "void/client" && b.imported === "fetch"))
      return {};

    const isFetch = (node: ESTree.Node) =>
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      isCallOf(node, "fetch", ["void/client"], bindings);
    /** `fetch(...)`, with or without `await`. */
    const isResult = (node: ESTree.Node) => {
      const value = strip(node);
      return isFetch(value) || (value.type === "AwaitExpression" && isFetch(strip(value.argument)));
    };

    return {
      CallExpression(node) {
        const callee = strip(node.callee);
        if (callee.type !== "MemberExpression" || memberName(callee) !== "json") return;
        const object = strip(callee.object);
        if (object.type === "AwaitExpression" && isFetch(strip(object.argument)))
          return context.report({ node, messageId: "json" });
        if (object.type !== "Identifier") return;
        const init = initOf(context, object);
        if (init !== null && strip(init).type === "AwaitExpression" && isResult(init))
          return context.report({ node, messageId: "json" });
        // fetch(...).then((r) => r.json())
        const def = variableOf(context, object)?.defs[0];
        const fn = def?.type === "Parameter" ? def.node : null;
        if (!fn || !isFunction(fn) || fn.params[0] !== def?.name) return;
        const then = fn.parent;
        if (then.type !== "CallExpression" || then.arguments[0] !== fn) return;
        const target = strip(then.callee);
        if (
          target.type === "MemberExpression" &&
          memberName(target) === "then" &&
          isResult(target.object)
        )
          context.report({ node, messageId: "json" });
      },
    };
  },
});
