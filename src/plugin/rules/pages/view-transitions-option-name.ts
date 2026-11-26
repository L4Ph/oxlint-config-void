import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, type ImportBinding } from "../../lib/ast.ts";
import {
  adapterPluginOptions,
  isAdapterLink,
  jsxAttribute,
  keyName,
  boundTo,
  ADAPTER_RUNTIME,
} from "../../lib/pages.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * guide/pages-routing/view-transitions.md: the adapter plugin takes `viewTransitions: true`
 * (plural, line 12); a link or `router.visit()` takes `viewTransition` (singular, lines 50
 * and 91).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Enable view transitions with viewTransitions on the adapter plugin, and override them with viewTransition on a link or visit.",
      norms: ["pages-routing/view-transitions/1", "pages-routing/view-transitions/2"],
      scope: "void",
    },
    messages: {
      plugin:
        "The adapter plugin option is `viewTransitions` (plural) and takes `true` or `false`. Write `viewTransitions: true`. See guide/pages-routing/view-transitions.md.",
      link: "`{{name}}` is not an option of a link or of `router.visit()`. The per-navigation override is `viewTransition` (singular). See guide/pages-routing/view-transitions.md.",
    },
    schema: [],
  },
  create(context) {
    let bindings = new Map<string, ImportBinding>();
    const routers = new Set<string>();
    const visits: ESTree.CallExpression[] = [];
    const wrong = (name: string) => name === "viewTransitions" || name === "view-transitions";
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      VariableDeclarator(node) {
        const init = node.init;
        if (
          node.id.type === "Identifier" &&
          init?.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          boundTo(bindings, init.callee.name, "useRouter", ADAPTER_RUNTIME)
        )
          routers.add(node.id.name);
      },
      JSXOpeningElement(node) {
        if (!isAdapterLink(node.name, bindings)) return;
        for (const name of ["viewTransitions", "view-transitions"]) {
          const attribute = jsxAttribute(node, name);
          if (attribute) context.report({ node: attribute, messageId: "link", data: { name } });
        }
      },
      CallExpression(node) {
        const options = adapterPluginOptions(node, bindings);
        if (options?.type === "ObjectExpression") {
          for (const member of options.properties) {
            if (member.type !== "Property") continue;
            const name = keyName(member);
            const value = member.value as Node;
            if (name === "viewTransition") context.report({ node: member, messageId: "plugin" });
            else if (
              name === "viewTransitions" &&
              value.type === "Literal" &&
              typeof value.value !== "boolean"
            )
              context.report({ node: value, messageId: "plugin" });
          }
          return;
        }
        const callee = node.callee;
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object.type === "Identifier" &&
          callee.property.type === "Identifier" &&
          (callee.property.name === "visit" || callee.property.name === "prefetch")
        )
          visits.push(node);
      },
      "Program:exit"() {
        for (const call of visits) {
          const callee = call.callee as ESTree.MemberExpression;
          if (!routers.has((callee.object as ESTree.IdentifierReference).name)) continue;
          const options = call.arguments[1];
          if (options?.type !== "ObjectExpression") continue;
          for (const member of options.properties) {
            const name = member.type === "Property" ? keyName(member) : null;
            if (name !== null && wrong(name))
              context.report({ node: member, messageId: "link", data: { name } });
          }
        }
      },
    };
  },
});
