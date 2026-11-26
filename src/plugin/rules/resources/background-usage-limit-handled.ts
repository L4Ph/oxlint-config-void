import { importBindings } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { hasCatchChain, inTryBlock, methodCall } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

const METHODS = new Set(["run", "stream", "image", "toMarkdown"]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Handle the rejected UsageLimit of ai calls in queues and cron jobs yourself.",
      norms: ["services/ai/14"],
      scope: "void",
    },
    messages: {
      unhandled:
        "`ai.{{method}}()` in `{{dir}}/` has no try/catch or `.catch()`. Outside a request a usage limit stays a rejected promise, and nothing turns it into a 429. Wrap the call and handle `error instanceof UsageLimit` (from 'void/limits'), rethrowing other errors. See guide/ai.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || (file.dir !== "queues" && file.dir !== "crons") || describe(file).private)
      return {};
    let bindings: ReturnType<typeof importBindings> | null = null;
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        const call = methodCall(node);
        if (!call || !METHODS.has(call[1]) || !bindings) return;
        const binding = bindings.get(call[0]);
        if (binding?.source !== "void/ai" || binding.imported !== "ai") return;
        if (inTryBlock(node) || hasCatchChain(node)) return;
        context.report({ node, messageId: "unhandled", data: { method: call[1], dir: file.dir } });
      },
    };
  },
});
