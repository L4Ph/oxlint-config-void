import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, isCallOf, property, staticString } from "../../lib/ast.ts";
import { hasSpread, strip } from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/api/client.md and guide/typed-fetch.md: `fetch` from `void/client` takes the
 * route pattern (`[id]` segments filled from `params`, search parameters from `query`),
 * an explicit `method` for anything but GET, and a plain-object `body` it serializes
 * itself. A call that sets `baseURL` talks to another host, so none of this applies to it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call void/client fetch with the route pattern and params/query options, an explicit method for non-GET calls, and a plain-object body.",
      norms: [
        "reference/client/2",
        "reference/client/3",
        "reference/client/6",
        "guide-core/typed-fetch/2",
        "guide-core/typed-fetch/4",
        "reference/client/7",
        "guide-core/typed-fetch/6",
      ],
      scope: "void",
    },
    messages: {
      params:
        "`fetch('{{url}}')` has a `[param]` segment but no `params` option. Pass `{ params: { … } }`. See reference/api/client.md (fetch).",
      method:
        "A call without `method` sends GET, whatever the body or type argument says. Add `method: '{{method}}'`. See reference/api/client.md (fetch).",
      url: "Build the request from the route pattern, not the URL string: write `fetch('/users/[id]', { params: { id } })` and put search parameters in `query`. See guide/typed-fetch.md.",
      stringify:
        "`fetch` serializes `body` as JSON itself. Pass the object, not `JSON.stringify(...)`. See reference/api/client.md (Differences from native fetch).",
      contentType:
        "`fetch` sets `Content-Type: application/json` for an object `body`. Remove this header. See reference/api/client.md (Differences from native fetch).",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "void/client" && b.imported === "fetch"))
      return {};
    return {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          !isCallOf(node, "fetch", ["void/client"], bindings)
        )
          return;
        const options = node.arguments[1] && strip(node.arguments[1]);
        if (options && options.type !== "ObjectExpression") return;
        if (options && (hasSpread(options) || property(options, "baseURL"))) return;
        const first = node.arguments[0];
        if (!first) return;

        // The URL
        if (first.type === "TemplateLiteral" && first.expressions.length > 0)
          context.report({ node: first, messageId: "url" });
        else if (first.type === "BinaryExpression" && first.operator === "+")
          context.report({ node: first, messageId: "url" });
        const url = staticString(first);
        if (url?.includes("?")) context.report({ node: first, messageId: "url" });
        else if (url && /\[[^\]]+\]/.test(url) && !(options && property(options, "params")))
          context.report({ node, messageId: "params", data: { url } });

        // The method
        if (!(options && property(options, "method"))) {
          const given = node.typeArguments?.params[1];
          const literal =
            given?.type === "TSLiteralType" ? staticString(given.literal as ESTree.Node) : null;
          const method =
            literal !== null && literal.toUpperCase() !== "GET"
              ? literal
              : options && property(options, "body")
                ? "POST"
                : null;
          if (method !== null) context.report({ node, messageId: "method", data: { method } });
        }

        // The body and its header
        const body = options && property(options, "body");
        if (
          body &&
          strip(body.value).type === "CallExpression" &&
          calleeName(strip(body.value)) === "JSON.stringify"
        )
          context.report({ node: body, messageId: "stringify" });
        const headers = options && property(options, "headers");
        const headerObject = headers && strip(headers.value);
        if (headerObject?.type === "ObjectExpression") {
          for (const member of headerObject.properties) {
            if (member.type !== "Property" || member.computed) continue;
            const key =
              member.key.type === "Identifier" ? member.key.name : staticString(member.key);
            if (
              key?.toLowerCase() === "content-type" &&
              /application\/json/i.test(staticString(member.value) ?? "")
            )
              context.report({ node: member, messageId: "contentType" });
          }
        }
      },
    };
  },
});
