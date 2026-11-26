import type { ESTree } from "vite-plus/lint/plugins";
import {
  importBindings,
  isCallOf,
  staticString,
  unwrap,
  type ImportBinding,
} from "../../lib/ast.ts";
import { firstParamName, HANDLER_SOURCES } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * "`c.set('shared', { ...c.get('shared'), auth: { user } })`" (guide/pages-routing/layouts.md:254):
 * a loader or action that sets `shared` keeps what middleware put there. Middleware itself
 * sets the starting value (line 239), so only `.server` files are read.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "When a loader or action sets shared data, spread the existing value so other keys survive.",
      norms: ["pages-routing/layouts/11"],
      scope: "void",
    },
    messages: {
      spread:
        "`c.set('shared', {...})` replaces everything middleware put in shared data. Start the object with `...c.get('shared')`. See guide/pages-routing/layouts.md.",
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
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "Identifier" ||
          !contexts.has(callee.object.name) ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "set"
        )
          return;
        const [key, value] = node.arguments;
        if (!key || key.type === "SpreadElement" || staticString(key) !== "shared") return;
        const object = value && value.type !== "SpreadElement" ? unwrap(value) : null;
        if (
          object?.type === "ObjectExpression" &&
          !object.properties.some((member) => member.type === "SpreadElement")
        )
          context.report({ node, messageId: "spread" });
      },
    };
  },
});
