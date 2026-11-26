import { importBindings, property, unwrap } from "../../lib/ast.ts";
import { methodCall } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass AI Gateway options as the third argument of ai.run, not inside its inputs.",
      norms: ["services/ai/19"],
      scope: "void",
    },
    messages: {
      gateway:
        "`gateway` is inside the inputs of `ai.run`, where it goes to the model as an input. Pass it as the third argument: `ai.run(model, inputs, { gateway: { skipCache: true } })`. See guide/ai.md.",
    },
    schema: [],
  },
  create(context) {
    let bindings: ReturnType<typeof importBindings> | null = null;
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        const call = methodCall(node);
        if (call?.[1] !== "run" || !bindings) return;
        const binding = bindings.get(call[0]);
        if (binding?.source !== "void/ai" || binding.imported !== "ai") return;
        const inputs = node.arguments[1] && unwrap(node.arguments[1]);
        const gateway = inputs && property(inputs, "gateway");
        if (gateway) context.report({ node: gateway, messageId: "gateway" });
      },
    };
  },
});
