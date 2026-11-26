import { importBindings, isCallOf, staticString } from "../../lib/ast.ts";
import { isClientFile } from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

const BAD_START = ["#", "?", "mailto:", "tel:", "ws://"];

/**
 * guide/type-safety.md §Typed URLs and Navigation: the SSE and live stream clients accept
 * route URLs and external `http://` or `https://` URLs; "same-page links, `mailto:`,
 * `tel:`, and `ws://` aren't stream destinations".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Give connectEventStream and connectLiveStream a route URL or an http(s) URL.",
      norms: ["guide-core/type-safety/18"],
      scope: "void",
    },
    messages: {
      destination:
        "`{{url}}` is not a stream destination. Pass a route URL (`/feed`) or an `http://` or `https://` URL. See guide/type-safety.md (Typed URLs and Navigation).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        const first = node.arguments[0];
        const stream =
          isCallOf(node, "connectEventStream", ["void/sse/client"], bindings) ||
          isCallOf(node, "connectLiveStream", ["void/live/client"], bindings);
        const url = stream && first ? staticString(first) : null;
        if (first && url !== null && BAD_START.some((start) => url.startsWith(start)))
          context.report({ node: first, messageId: "destination", data: { url } });
      },
    };
  },
});
