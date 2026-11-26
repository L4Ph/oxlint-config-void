import type { ESTree } from "vite-plus/lint/plugins";
import { staticString, unwrap } from "../../lib/ast.ts";
import { hasSpread } from "../../lib/frameworks.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * The head page overrides `headDefaults` with `{ ...c.get('headDefaults'), titleTemplate }`.
 * A `c.set('headDefaults', { ... })` with no spread replaces whatever earlier middleware
 * set; the rule reports it only in a file that itself reads `c.get('headDefaults')`, which
 * shows the author knew there was a value. The page does not say which middleware runs
 * first, so a file name's numeric prefix is not used.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Spread c.get('headDefaults') into the object a middleware sets as headDefaults, so earlier defaults survive.",
      norms: ["pages-routing/head/6"],
      scope: "void",
    },
    messages: {
      spread:
        "This `c.set('headDefaults', ...)` replaces the defaults earlier middleware set, though this file reads them. Start the object with `...c.get('headDefaults')`. See guide/pages-routing/head.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.convention !== "middleware" || kind.private) return {};
    let reads = 0;
    const sets: ESTree.CallExpression[] = [];
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.property.type !== "Identifier") return;
        const first = node.arguments[0];
        if (!first || first.type === "SpreadElement" || staticString(first) !== "headDefaults")
          return;
        if (callee.property.name === "get") reads++;
        else if (callee.property.name === "set") sets.push(node);
      },
      "Program:exit"() {
        if (reads === 0) return;
        for (const call of sets) {
          const value = call.arguments[1];
          const object = value && value.type !== "SpreadElement" ? unwrap(value) : null;
          if (object?.type === "ObjectExpression" && !hasSpread(object))
            context.report({ node: call, messageId: "spread" });
        }
      },
    };
  },
});
