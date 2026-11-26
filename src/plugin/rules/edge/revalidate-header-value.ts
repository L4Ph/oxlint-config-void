import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { contains, handlerFunctions, type HandlerFn } from "../../lib/edge.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Route handlers can set the `x-revalidate` response header to override the TTL"; its value
 * is a number of seconds, written as a string, and `0` skips caching
 * (guide/edge/revalidation.md:88-100).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Set x-revalidate to a whole number of seconds written as a string.",
      norms: ["edge-integrations/revalidation/12"],
      scope: "void",
    },
    messages: {
      number:
        "`x-revalidate` is given a number, and a header value is a string. Write `c.header('x-revalidate', '{{value}}')`. See guide/edge/revalidation.md.",
      value:
        "`x-revalidate: {{value}}` is not a whole number of seconds. Write a string such as '300', or '0' to skip caching. See guide/edge/revalidation.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (file === null) return {};
    const kind = describe(file);
    const governed =
      kind.convention === "routes" ||
      kind.convention === "middleware" ||
      (kind.convention === "pages" && kind.serverCompanion);
    if (!governed) return {};
    const bindings = importBindings(context.sourceCode.ast);
    const handlers: HandlerFn[] = [];
    return {
      CallExpression(node) {
        handlers.push(...handlerFunctions(node, bindings));
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "Identifier" ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "header"
        )
          return;
        const name = callee.object.name;
        if (!handlers.some((handler) => handler.name === name && contains(handler.fn, node)))
          return;
        const [header, value] = node.arguments;
        if (!header || !value || value.type === "SpreadElement") return;
        if (staticString(header)?.toLowerCase() !== "x-revalidate") return;
        const literal = unwrap(value);
        if (literal.type === "Literal" && typeof literal.value === "number")
          context.report({
            node: value,
            messageId: "number",
            data: { value: String(literal.value) },
          });
        const text = staticString(value);
        if (text !== null && !/^\d+$/.test(text))
          context.report({ node: value, messageId: "value", data: { value: text } });
      },
    };
  },
});
