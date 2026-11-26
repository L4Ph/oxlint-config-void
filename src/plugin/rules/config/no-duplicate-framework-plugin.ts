import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, unwrap } from "../../lib/ast.ts";
import { keyName } from "../../lib/config.ts";
import { baseName } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/** Void adapter, where it comes from, and the framework plugins it already includes. */
const ADAPTERS = [
  ["voidReact", "@void/react/plugin", ["@vitejs/plugin-react", "@vitejs/plugin-react-swc"]],
  ["voidVue", "@void/vue/plugin", ["@vitejs/plugin-vue"]],
  ["voidSvelte", "@void/svelte/plugin", ["@sveltejs/vite-plugin-svelte"]],
  ["voidSolid", "@void/solid/plugin", ["vite-plugin-solid"]],
] as const;

/**
 * "It already includes `@vitejs/plugin-react`, so you do not need to install or configure
 * that separately" (reference/api/pages.md:123; the same for Vue :67, Svelte :208, Solid
 * :262, guide/pages-routing/overview.md:90).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not add the framework's own Vite plugin next to the Void adapter that already includes it.",
      norms: [
        "reference/pages/7",
        "reference/pages/14",
        "reference/pages/25",
        "reference/pages/31",
        "pages-routing/overview/5",
      ],
      scope: "void",
    },
    messages: {
      duplicate:
        "`{{adapter}}()` already includes `{{package}}`, so this second plugin runs twice. Remove `{{callee}}()` and pass its options as `{{adapter}}({ {{option}}: { ... } })`. See reference/api/pages.md.",
    },
    schema: [],
  },
  create(context) {
    if (!baseName(context.filename).startsWith("vite.config.")) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Property(node) {
        if (keyName(node as ESTree.ObjectProperty) !== "plugins") return;
        const array = unwrap(node.value);
        if (array.type !== "ArrayExpression") return;
        const elements = array.elements.flatMap((element) =>
          element === null || element.type === "SpreadElement" ? [] : [unwrap(element)],
        );
        for (const [adapter, source, packages] of ADAPTERS) {
          if (!elements.some((element) => isCallOf(element, adapter, [source], bindings))) continue;
          for (const element of elements) {
            if (element.type !== "CallExpression" || element.callee.type !== "Identifier") continue;
            const binding = bindings.get(element.callee.name);
            if (binding === undefined || binding.typeOnly) continue;
            if (!(packages as readonly string[]).includes(binding.source)) continue;
            context.report({
              node: element,
              messageId: "duplicate",
              data: {
                adapter,
                package: binding.source,
                callee: element.callee.name,
                option: adapter.slice("void".length).toLowerCase(),
              },
            });
          }
        }
      },
    };
  },
});
