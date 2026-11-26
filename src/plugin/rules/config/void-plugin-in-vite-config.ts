import { importBindings, property, unwrap } from "../../lib/ast.ts";
import { baseName, configObject, objectAt, pluginCalls } from "../../lib/config.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * Which array of a config file holds the Vite plugins: `plugins` in `vite.config.*`, and
 * `vite.plugins` in the framework configs that pass options to Vite.
 */
function pluginsKey(name: string): "plugins" | "vite.plugins" | null {
  if (/^vite\.config\.[cm]?[jt]s$/.test(name)) return "plugins";
  if (/^(?:nuxt|astro)\.config\.[cm]?[jt]s$/.test(name)) return "vite.plugins";
  return null;
}

/**
 * "`vite.config.ts` must include `voidPlugin()`" (reference/structure.md:145), imported from
 * `void` (reference/api/plugin.md:10); Nuxt and Astro take it under `vite.plugins`
 * (integrations/frameworks/nuxt.md:46, astro.md:40).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Include voidPlugin(), imported from 'void', in the Vite config's plugins.",
      norms: [
        "reference/plugin/1",
        "reference/structure/22",
        "guide-core/quickstart/8",
        "guide-core/app-types/4",
        "edge-integrations/frameworks-overview/1",
        "edge-integrations/frameworks-astro/4",
        "edge-integrations/frameworks-nuxt/5",
      ],
      scope: "any",
    },
    messages: {
      missing:
        "These plugins do not include `voidPlugin()`, so Void's routing, binding inference and migrations are off. Add `import { voidPlugin } from 'void'` and put `voidPlugin()` in `{{where}}`. See reference/structure.md.",
      wrongSource:
        "`voidPlugin` is imported from '{{source}}'. It is a named export of 'void': `import { voidPlugin } from 'void'`. See reference/api/plugin.md.",
    },
    schema: [],
  },
  create(context) {
    const where = pluginsKey(baseName(context.filename));
    if (where === null) return {};
    // Only the config at the app's root: a nested vite.config.* belongs to something else.
    const settings = context.settings?.void as { root?: string; sourceDir?: string } | undefined;
    const file = locate({
      filename: context.filename,
      cwd: context.cwd,
      settings: { ...context.settings, void: { ...settings, sourceDir: undefined } },
    });
    return {
      Program(program) {
        const bindings = importBindings(program);
        for (const binding of bindings.values())
          if (binding.imported === "voidPlugin" && !binding.typeOnly && binding.source !== "void")
            context.report({
              node: binding.node,
              messageId: "wrongSource",
              data: { source: binding.source },
            });
        if (file === null || file.segments.length !== 1) return;
        const config = configObject(program);
        if (config === null) return;
        const holder = where === "plugins" ? config : objectAt(config, "vite");
        const plugins = holder === null ? null : property(holder, "plugins");
        const array = plugins === null ? null : unwrap(plugins.value);
        if (array?.type !== "ArrayExpression") return;
        const calls = pluginCalls(array, bindings, program);
        if (calls === null) return;
        const present = calls.some((call) => {
          const name = call.callee.type === "Identifier" ? call.callee.name : "";
          return name === "voidPlugin" || bindings.get(name)?.imported === "voidPlugin";
        });
        if (!present) context.report({ node: array, messageId: "missing", data: { where } });
      },
    };
  },
});
