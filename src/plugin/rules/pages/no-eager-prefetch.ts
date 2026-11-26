import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, valueAt, type ImportBinding } from "../../lib/ast.ts";
import { adapterPluginOptions, isAdapterLink, jsxAttribute, jsxValue } from "../../lib/pages.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const EAGER = new Set(["mount", "visible"]);

const isEager = (node: Node): boolean =>
  node.type === "Literal" && typeof node.value === "string" && EAGER.has(node.value);

/**
 * "Prefer 'hover' or 'click'; 'mount' and 'visible' can load many pages in a long list"
 * (guide/pages-routing/overview.md:487). A list that also has 'hover' or 'click', such as
 * the docs' own `['visible', 'hover']` (reference/api/pages.md:47), is left alone.
 */
function eager(value: Node | null | undefined): Node | null {
  if (!value) return null;
  if (isEager(value)) return value;
  if (
    value.type === "ArrayExpression" &&
    value.elements.length > 0 &&
    value.elements.every((element) => element !== null && isEager(element as Node))
  )
    return value;
  return null;
}

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer the 'hover' or 'click' prefetch strategy over 'mount' or 'visible'.",
      norms: ["pages-routing/overview/27"],
      scope: "void",
    },
    messages: {
      eager:
        "The 'mount' and 'visible' strategies load a page for every link that renders or scrolls into view, which is many pages in a long list. Use 'hover' or 'click'. See guide/pages-routing/overview.md.",
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
        const attribute = jsxAttribute(node, "prefetch");
        const found = eager(attribute && jsxValue(attribute));
        if (found) context.report({ node: found, messageId: "eager" });
      },
      CallExpression(node) {
        const options = adapterPluginOptions(node, bindings);
        if (!options) return;
        const found = eager(valueAt(options, "prefetch.defaultStrategy"));
        if (found) context.report({ node: found, messageId: "eager" });
      },
    };
  },
});
