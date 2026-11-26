import { importBindings, isCallOf, property, unwrap, valueAt } from "../../lib/ast.ts";
import { hasSpread, optionsOf } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const MAX = 256;

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give `defineLiveStream` an `id`, and keep `maxSubscriptionsPerTopic` at 256 or less.",
      norms: ["services/live/3", "services/live/19"],
      scope: "void",
    },
    messages: {
      id: "`defineLiveStream` needs an options object with an `id`, as in `defineLiveStream({ id: 'app' })`. See guide/live.md.",
      limit:
        "`maxSubscriptionsPerTopic` cannot be raised above {{max}}, and this sets {{value}}. Lower it, or split subscribers across application topics. See guide/live.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!isCallOf(node, "defineLiveStream", ["void/live"], bindings)) return;
        const first = node.arguments[0];
        const argument = first && first.type !== "SpreadElement" ? unwrap(first) : null;
        // an identifier or a call is unknown; only a missing or literal argument is certain
        const certain =
          node.arguments.length === 0 ||
          argument?.type === "ObjectExpression" ||
          argument?.type === "Literal" ||
          argument?.type === "ArrayExpression";
        if (certain) {
          const options = optionsOf(node);
          if (!options || (!hasSpread(options) && !property(options, "id")))
            context.report({ node, messageId: "id" });
        }
        const limit = argument ? valueAt(argument, "limits.maxSubscriptionsPerTopic") : null;
        if (limit?.type === "Literal" && typeof limit.value === "number" && limit.value > MAX)
          context.report({
            node: limit,
            messageId: "limit",
            data: { max: String(MAX), value: String(limit.value) },
          });
      },
    };
  },
});
