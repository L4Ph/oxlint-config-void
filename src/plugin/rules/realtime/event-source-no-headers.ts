import { importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

/**
 * Narrower than the plan: `method` is not reported. The page says the client "does not
 * support request bodies or arbitrary headers" and says nothing of a method option.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass no `headers` or `body` to `connectEventStream`, which wraps `EventSource`.",
      norms: ["services/sse/9"],
      scope: "void",
    },
    messages: {
      option:
        "`connectEventStream` wraps the browser's `EventSource`, which cannot send `{{option}}`. Authenticate with cookies (`withCredentials: true`) or a signed URL, or read the stream with `fetch` from a route. See guide/sse.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!isCallOf(node, "connectEventStream", ["void/sse/client"], bindings)) return;
        const options = node.arguments[1];
        const object = options && options.type !== "SpreadElement" ? unwrap(options) : null;
        if (!object) return;
        for (const option of ["headers", "body"]) {
          const member = property(object, option);
          if (member) context.report({ node: member, messageId: "option", data: { option } });
        }
      },
    };
  },
});
