import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, unwrap, type ImportBinding } from "../../lib/ast.ts";
import { boundTo, calledIdentifier, firstParamName, HANDLER_SOURCES } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * "Checks that determine the response status must finish before deferred streaming starts"
 * (guide/pages-routing/errors.md:111); "Set it before deferred streaming starts"
 * (guide/pages-routing/loaders.md:51). Throwing an `HTTPException` inside `defer()` is how
 * loaders.md shows a message, so only `c.status()` and `c.redirect()` are reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not set the response status or redirect inside a defer() callback.",
      norms: ["pages-routing/errors/9", "pages-routing/loaders/7"],
      scope: "void",
    },
    messages: {
      status:
        "`{{call}}` runs after the response has started streaming, so it cannot change the status or the destination. Call it in the loader before `defer()` is returned. See guide/pages-routing/loaders.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    let bindings = new Map<string, ImportBinding>();
    const contexts = new Set<string>();
    const deferred: [number, number][] = [];
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        if (isCallOf(node, "defineHandler", HANDLER_SOURCES, bindings)) {
          const last = node.arguments[node.arguments.length - 1];
          const fn = last && unwrap(last as Node);
          if (fn && (fn.type === "ArrowFunctionExpression" || fn.type === "FunctionExpression")) {
            const name = firstParamName(fn);
            if (name !== null) contexts.add(name);
          }
        }
        const called = calledIdentifier(node);
        if (called !== null && boundTo(bindings, called, "defer", HANDLER_SOURCES)) {
          const last = node.arguments[node.arguments.length - 1];
          const fn = last && unwrap(last as Node);
          if (fn && (fn.type === "ArrowFunctionExpression" || fn.type === "FunctionExpression"))
            deferred.push(fn.range);
          return;
        }
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "Identifier" ||
          callee.property.type !== "Identifier" ||
          !contexts.has(callee.object.name) ||
          (callee.property.name !== "status" && callee.property.name !== "redirect")
        )
          return;
        if (deferred.some(([start, end]) => start <= node.range[0] && node.range[1] <= end))
          context.report({
            node,
            messageId: "status",
            data: { call: `${callee.object.name}.${callee.property.name}()` },
          });
      },
    };
  },
});
