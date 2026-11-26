import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, valueAt, type ImportBinding } from "../../lib/ast.ts";
import { adapterPluginOptions, isAdapterLink, jsxAttribute, jsxValue } from "../../lib/pages.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const STRATEGIES = new Set(["hover", "click", "mount", "visible"]);

/** The strategy `value` spells, or `unknown` when it is not a literal. */
function badStrategy(value: Node): Node | null {
  if (value.type === "Literal")
    return value.value === true ||
      value.value === false ||
      (typeof value.value === "string" && STRATEGIES.has(value.value))
      ? null
      : value;
  if (value.type === "ArrayExpression")
    for (const element of value.elements)
      if (
        element !== null &&
        element.type === "Literal" &&
        !(typeof element.value === "string" && STRATEGIES.has(element.value))
      )
        return element;
  return null;
}

/** A `cacheFor` literal that is not milliseconds, a duration string or a pair. */
function badCache(value: Node): Node | null {
  if (value.type === "Literal")
    return typeof value.value === "number" || typeof value.value === "string" ? null : value;
  if (value.type === "ArrayExpression") {
    if (value.elements.some((element) => element?.type === "SpreadElement")) return null;
    if (value.elements.length !== 2) return value;
    for (const element of value.elements)
      if (
        element !== null &&
        element.type === "Literal" &&
        typeof element.value !== "number" &&
        typeof element.value !== "string"
      )
        return element;
  }
  return null;
}

/**
 * reference/api/pages.md:33-53: `prefetch` takes `true`, `false`, a strategy or an array of
 * strategies; `cacheFor` is milliseconds, a duration, or a `[fresh, stale]` pair. The units
 * of a duration string are not listed, so a string is never judged.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give prefetch a documented strategy and cacheFor milliseconds, a duration or a pair.",
      norms: ["reference/pages/3", "reference/pages/5"],
      scope: "void",
    },
    messages: {
      strategy:
        "`prefetch` takes `true`, `false`, 'hover', 'click', 'mount', 'visible', or an array of those strategies. Use one of them. See reference/api/pages.md.",
      cacheFor:
        "`cacheFor` is milliseconds, a duration such as '5m', or a `[fresh, stale]` pair such as ['30s', '5m']. Write one of those. See reference/api/pages.md.",
    },
    schema: [],
  },
  create(context) {
    let bindings = new Map<string, ImportBinding>();
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      JSXOpeningElement(node) {
        if (!isAdapterLink(node.name, bindings)) return;
        const prefetch = jsxAttribute(node, "prefetch");
        const cacheFor = jsxAttribute(node, "cacheFor");
        const strategy = prefetch && jsxValue(prefetch);
        const bad = strategy ? badStrategy(strategy) : null;
        if (bad) context.report({ node: bad, messageId: "strategy" });
        const cache = cacheFor && jsxValue(cacheFor);
        const badTtl = cache ? badCache(cache) : null;
        if (badTtl) context.report({ node: badTtl, messageId: "cacheFor" });
      },
      CallExpression(node) {
        const options = adapterPluginOptions(node, bindings);
        if (!options) return;
        const strategy = valueAt(options, "prefetch.defaultStrategy");
        const bad = strategy ? badStrategy(strategy) : null;
        if (bad) context.report({ node: bad, messageId: "strategy" });
        const cache = valueAt(options, "prefetch.cacheFor");
        const badTtl = cache ? badCache(cache) : null;
        if (badTtl) context.report({ node: badTtl, messageId: "cacheFor" });
      },
    };
  },
});
