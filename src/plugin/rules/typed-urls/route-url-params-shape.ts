import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, isCallOf, property, staticString } from "../../lib/ast.ts";
import { strip } from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/api/types.md §routeUrl: "Pass raw parameter values for URL encoding";
 * guide/type-safety.md: for a catch-all page "pass the full path as one value". Reported:
 * an `encodeURIComponent` / `encodeURI` call as a param value, and an array or `.split()`
 * as the value of a catch-all param.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give routeUrl() raw param values, and a catch-all param the whole path as one string.",
      norms: ["reference/types/4", "guide-core/type-safety/8"],
      scope: "void",
    },
    messages: {
      encoded:
        "routeUrl() URL-encodes its params, so `{{name}}()` encodes the value twice. Pass the raw value. See reference/api/types.md (routeUrl).",
      catchAll:
        "`{{param}}` is a catch-all param: pass the whole remaining path as one string (`'docs/get started'`), not {{what}}. See guide/type-safety.md (Typed URLs and Navigation).",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "void/routes")) return {};
    return {
      CallExpression(node) {
        if (!isCallOf(node, "routeUrl", ["void/routes"], bindings)) return;
        const options = node.arguments[1] && strip(node.arguments[1]);
        const params = options && property(options, "params")?.value;
        const object = params && strip(params);
        if (!object || object.type !== "ObjectExpression") return;
        const pattern = node.arguments[0] ? staticString(node.arguments[0]) : null;
        const catchAll = new Set(
          [...(pattern ?? "").matchAll(/\[\.\.\.([^\]]*)\]/g)].map((m) => m[1] || "*"),
        );
        for (const member of object.properties) {
          if (member.type !== "Property" || member.computed) continue;
          const key =
            member.key.type === "Identifier"
              ? member.key.name
              : String((member.key as ESTree.StringLiteral).value);
          const value = strip(member.value);
          const name = value.type === "CallExpression" ? calleeName(value) : null;
          if (name === "encodeURIComponent" || name === "encodeURI") {
            context.report({ node: value, messageId: "encoded", data: { name } });
          } else if (catchAll.has(key)) {
            const what =
              value.type === "ArrayExpression"
                ? "an array"
                : name !== null && name.endsWith(".split")
                  ? "the result of `.split()`"
                  : null;
            if (what !== null)
              context.report({ node: value, messageId: "catchAll", data: { param: key, what } });
          }
        }
      },
    };
  },
});
