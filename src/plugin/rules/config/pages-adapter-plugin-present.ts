import { importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { configObject, isViteConfig, pluginCalls } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const ADAPTERS = [
  ["voidReact", "@void/react/plugin"],
  ["voidVue", "@void/vue/plugin"],
  ["voidSvelte", "@void/svelte/plugin"],
  ["voidSolid", "@void/solid/plugin"],
] as const;

/** "Add both plugins to your Vite config" (guide/pages-routing/overview.md:40). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "When the app uses Pages routing, add an adapter plugin (voidReact, voidVue, voidSvelte or voidSolid) next to voidPlugin().",
      norms: ["pages-routing/overview/4"],
      scope: "void",
    },
    messages: {
      missing:
        "`voidPlugin()` is here without a Pages adapter. Add `voidReact()`, `voidVue()`, `voidSvelte()` or `voidSolid()` from its `@void/<framework>/plugin` to `plugins`. See guide/pages-routing/overview.md.",
    },
    schema: [
      {
        type: "object",
        properties: { pages: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] as { pages?: boolean } | undefined;
    if (options?.pages !== true || !isViteConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const plugins = config === null ? null : property(config, "plugins");
        const array = plugins === null ? null : unwrap(plugins.value);
        if (array?.type !== "ArrayExpression") return;
        const bindings = importBindings(program);
        const calls = pluginCalls(array, bindings, program);
        if (calls === null) return;
        const has = (name: string, source: string) =>
          calls.some((call) => isCallOf(call, name, [source], bindings));
        if (!has("voidPlugin", "void")) return;
        if (ADAPTERS.some(([name, source]) => has(name, source))) return;
        context.report({ node: array, messageId: "missing" });
      },
    };
  },
});
