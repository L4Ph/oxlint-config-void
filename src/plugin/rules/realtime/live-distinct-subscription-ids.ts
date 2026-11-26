import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, property, staticString, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

/** `<receiver>.subscribe({ id: "<literal>" })` as a statement of its own: the receiver and the id. */
function bareSubscribe(
  statement: ESTree.Node,
): { call: ESTree.Node; receiver: string; id: string } | null {
  if (statement.type !== "ExpressionStatement") return null;
  let call = unwrap(statement.expression);
  if (call.type === "AwaitExpression") call = unwrap(call.argument);
  if (call.type !== "CallExpression" || call.callee.type !== "MemberExpression") return null;
  if (
    call.callee.computed ||
    call.callee.property.type !== "Identifier" ||
    call.callee.property.name !== "subscribe"
  )
    return null;
  const receiver = calleeName(call.callee.object);
  const first = call.arguments[0];
  const options = first && first.type !== "SpreadElement" ? unwrap(first) : null;
  const idValue = options && property(options, "id")?.value;
  const id = idValue ? staticString(idValue) : null;
  return receiver !== null && id !== null ? { call, receiver, id } : null;
}

/**
 * Narrower than the plan: only calls that are statements of their own in one block, since
 * a call whose result is kept (`const off = await stream.subscribe(...)`) can be undone and
 * subscribed again, and calls in different branches never both run.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Give each subscription of one live connection its own id.",
      norms: ["services/live/10"],
      scope: "void",
    },
    messages: {
      reused:
        "`{{receiver}}` already subscribed with `id: '{{id}}'`, and reusing an id replaces that subscription. Give this one a different `id`. See guide/live.md.",
    },
    schema: [],
  },
  create(context) {
    const check = (statements: ESTree.Node[]) => {
      const seen = new Set<string>();
      for (const statement of statements) {
        const subscribe = bareSubscribe(statement);
        if (!subscribe) continue;
        const key = `${subscribe.receiver}\0${subscribe.id}`;
        if (seen.has(key))
          context.report({
            node: subscribe.call,
            messageId: "reused",
            data: { receiver: subscribe.receiver, id: subscribe.id },
          });
        seen.add(key);
      }
    };
    return {
      Program: (node) => check(node.body),
      BlockStatement: (node) => check(node.body),
    };
  },
});
