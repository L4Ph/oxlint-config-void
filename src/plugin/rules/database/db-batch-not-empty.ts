import { importBindings, unwrap } from "../../lib/ast.ts";
import { isDbIdentifier } from "../../lib/database.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass db.batch() at least one query: D1 rejects an empty batch.",
      norms: ["reference/database/18"],
      scope: "void",
    },
    messages: {
      empty:
        "`db.batch([])` has no query, and D1 needs at least one. Skip the call when there is nothing to write, or add the query. See reference/api/database.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "batch" ||
          !isDbIdentifier(callee.object, bindings)
        )
          return;
        const first = node.arguments[0];
        if (
          first &&
          unwrap(first).type === "ArrayExpression" &&
          (unwrap(first) as { elements: unknown[] }).elements.length === 0
        )
          context.report({ node, messageId: "empty" });
      },
    };
  },
});
