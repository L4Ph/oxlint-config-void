import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, type ImportBinding } from "../../lib/ast.ts";
import { isAdapterLink, jsxAttribute, jsxValue } from "../../lib/pages.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/** Whether an attribute is present and not the literal `false`. */
function isOn(element: ESTree.JSXOpeningElement, name: string): ESTree.JSXAttribute | null {
  const attribute = jsxAttribute(element, name);
  if (!attribute) return null;
  const value = jsxValue(attribute);
  return value?.type === "Literal" && value.value === false ? null : attribute;
}

/**
 * reference/api/pages.md:172 and guide/pages-routing/overview.md:309: `prefetch` and
 * `reloadDocument` are GET-only and throw for mutation links; a GET `data` becomes query
 * parameters, "use scalar values or arrays", and nested objects throw.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not put prefetch or reloadDocument on a non-GET Link, or a nested object in a GET Link's data.",
      norms: [
        "reference/pages/11",
        "reference/pages/18",
        "reference/pages/29",
        "reference/pages/35",
        "pages-routing/overview/18",
        "reference/pages/10",
        "reference/pages/17",
        "reference/pages/28",
        "reference/pages/34",
        "pages-routing/overview/19",
      ],
      scope: "void",
    },
    messages: {
      getOnly:
        '`{{name}}` works only on GET links, and this `<Link>` has `method="{{method}}"`: Void throws when it renders. Remove `{{name}}`, or remove `method`. See reference/api/pages.md.',
      nested:
        "A GET link's `data` becomes query parameters, and a nested object throws. Pass strings, numbers, booleans or arrays of them. See guide/pages-routing/overview.md.",
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
        const methodAttribute = jsxAttribute(node, "method");
        const methodValue = methodAttribute && jsxValue(methodAttribute);
        if (methodAttribute && !methodValue) return;
        const method =
          methodValue === null || methodValue === undefined
            ? "get"
            : methodValue.type === "Literal" && typeof methodValue.value === "string"
              ? methodValue.value.toLowerCase()
              : null;
        if (method === null) return;
        if (method !== "get") {
          for (const name of ["prefetch", "reloadDocument"]) {
            const attribute = isOn(node, name);
            if (attribute)
              context.report({ node: attribute, messageId: "getOnly", data: { name, method } });
          }
          return;
        }
        const data = jsxAttribute(node, "data");
        const object = data && jsxValue(data);
        if (!object || object.type !== "ObjectExpression") return;
        for (const member of object.properties) {
          if (member.type !== "Property") continue;
          const value = member.value as Node;
          const nested =
            value.type === "ObjectExpression" ||
            (value.type === "ArrayExpression" &&
              value.elements.some((element) => element?.type === "ObjectExpression"));
          if (nested) context.report({ node: member.value, messageId: "nested" });
        }
      },
    };
  },
});
