import { isVoidSpecifier } from "../../lib/imports.ts";
import { defineRule } from "../../rule.ts";

const RUNTIME = new Set([
  "Link",
  "Form",
  "useRouter",
  "useParams",
  "useNavigation",
  "useForm",
  "useIslandForm",
  "action",
  "isVoidActionError",
  "isCallSiteActionError",
  "getValidationErrors",
  "useShared",
]);
const ADAPTERS = new Set(["@void/react", "@void/vue", "@void/svelte", "@void/solid"]);
const PLUGINS: Record<string, string> = {
  voidReact: "@void/react/plugin",
  voidVue: "@void/vue/plugin",
  voidSvelte: "@void/svelte/plugin",
  voidSolid: "@void/solid/plugin",
};
/** Entry points that do not export the adapter runtime. */
const NOT_ADAPTERS = new Set(["void", "void/pages", "void/client", "void/handler"]);

/**
 * reference/api/pages.md:99-300: `Link`, the hooks and `useForm` are "Imported from
 * `@void/<adapter>`"; `voidReact()` and its siblings are "Imported from `@void/<adapter>/plugin`";
 * pages.md:181 and guide/pages-routing/loaders.md:181: "import `Deferred` from the framework
 * adapter". reference/api.md:36 also lists `Deferred` under `void`; the adapter pages are the
 * ones that say where to import it from for explicit prop annotations.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Import the page runtime, Deferred and the Vite plugin from the adapter packages (@void/react, @void/vue, @void/svelte, @void/solid and their /plugin).",
      norms: [
        "reference/pages/8",
        "reference/pages/15",
        "reference/pages/26",
        "reference/pages/32",
        "reference/pages/21",
        "pages-routing/loaders/14",
        "reference/pages/6",
        "reference/pages/13",
        "reference/pages/24",
        "reference/pages/30",
      ],
      scope: "void",
    },
    messages: {
      runtime:
        "`{{name}}` is exported by your framework's adapter, not by `{{source}}`: `import { {{name}} } from '@void/react'` (or `@void/vue`, `@void/svelte`, `@void/solid`). See reference/api/pages.md.",
      deferred:
        "Import `Deferred` from your framework's adapter (`@void/react`, `@void/vue`, `@void/svelte` or `@void/solid`), not from `{{source}}`, so the type matches that adapter's client runtime. See reference/api/pages.md.",
      plugin:
        "`{{name}}` is imported from `{{expected}}`, not from `{{source}}`. See reference/api/pages.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (!isVoidSpecifier(source)) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name =
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : String(specifier.imported.value);
          if (RUNTIME.has(name) && NOT_ADAPTERS.has(source))
            context.report({ node: specifier, messageId: "runtime", data: { name, source } });
          else if (name === "Deferred" && !ADAPTERS.has(source) && !source.startsWith("@void/"))
            context.report({ node: specifier, messageId: "deferred", data: { source } });
          else if (name in PLUGINS && source !== PLUGINS[name])
            context.report({
              node: specifier,
              messageId: "plugin",
              data: { name, source, expected: PLUGINS[name] ?? "" },
            });
        }
      },
    };
  },
});
