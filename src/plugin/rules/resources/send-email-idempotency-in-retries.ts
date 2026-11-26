import { importBindings, property, unwrap } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * Queue consumers and cron jobs run again after a failure. A `sendEmail()` without an
 * `idempotencyKey` sends a duplicate each time (a new key creates a new send).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass an idempotencyKey to sendEmail() in queue consumers and cron jobs.",
      norms: ["services/sending/25"],
      scope: "void",
    },
    messages: {
      missing:
        "This `sendEmail()` runs in a job that may be retried and has no `idempotencyKey`, so a retry sends the mail again. Add one that is the same for every retry of this send, such as `idempotencyKey: `invoice:${id}:ready``. See guide/email/sending.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || (file.dir !== "queues" && file.dir !== "crons") || describe(file).private)
      return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        const binding = bindings.get(node.callee.name);
        if (binding?.imported !== "sendEmail" || binding.source !== "void/email") return;
        const first = node.arguments[0];
        if (!first || first.type === "SpreadElement") return;
        const options = unwrap(first);
        if (options.type !== "ObjectExpression") return;
        if (options.properties.some((member) => member.type === "SpreadElement")) return;
        if (property(options, "idempotencyKey") === null)
          context.report({ node: options, messageId: "missing" });
      },
    };
  },
});
