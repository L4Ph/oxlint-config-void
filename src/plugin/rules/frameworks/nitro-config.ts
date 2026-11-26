import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import {
  configObject,
  hasSpread,
  importedCall,
  isConfigFile,
  optionsOf,
  pluginCalls,
  stringArray,
} from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * The Nuxt and Analog setups configure Nitro the same way: `preset: 'cloudflare-module'`
 * and `modules` listing `void/nitro` (Analog also `nitro-cloudflare-dev`). A config with
 * no `nitro` is reported on the config; a missing `modules` property is not, because the
 * pages tie `void/nitro` to using `void/db` in server routes. Analog's `ssr: true` is in
 * the example but not asked for in the prose, so it is not checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Set nitro.preset to 'cloudflare-module' and list void/nitro in nitro.modules in Nuxt and Analog configs.",
      norms: [
        "edge-integrations/frameworks-analog/3",
        "edge-integrations/frameworks-nuxt/2",
        "edge-integrations/frameworks-analog/5",
        "edge-integrations/frameworks-nuxt/6",
      ],
      scope: "framework:analog,nuxt",
    },
    messages: {
      preset:
        "Nitro's `preset` is not set to 'cloudflare-module'. Add `preset: 'cloudflare-module'` to `nitro`. See integrations/frameworks/{{page}}.md.",
      modules:
        "`nitro.modules` lacks {{missing}}. Add it to the array. See integrations/frameworks/{{page}}.md.",
    },
    schema: [],
  },
  create(context) {
    const nuxt = isConfigFile(context, "nuxt");
    if (!nuxt && !isConfigFile(context, "vite")) return {};
    const page = nuxt ? "nuxt" : "analog";
    const required = nuxt ? ["void/nitro"] : ["nitro-cloudflare-dev", "void/nitro"];

    function check(owner: ESTree.ObjectExpression, anchor: ESTree.Node) {
      const member = property(owner, "nitro");
      if (!member) {
        if (!hasSpread(owner))
          context.report({ node: anchor, messageId: "preset", data: { page } });
        return;
      }
      const nitro = unwrap(member.value);
      if (nitro.type !== "ObjectExpression") return;
      const preset = property(nitro, "preset");
      if (!preset) {
        if (!hasSpread(nitro)) context.report({ node: nitro, messageId: "preset", data: { page } });
      } else {
        const value = staticString(preset.value);
        if (value !== null && value !== "cloudflare-module")
          context.report({ node: preset.value, messageId: "preset", data: { page } });
      }
      const modules = property(nitro, "modules");
      const listed = modules ? stringArray(modules.value) : null;
      if (!modules || listed === null) return;
      const missing = required.filter((name) => !listed.includes(name));
      if (missing.length > 0)
        context.report({
          node: modules.value,
          messageId: "modules",
          data: { page, missing: missing.map((name) => `'${name}'`).join(" and ") },
        });
    }

    return {
      Program(program) {
        const config = configObject(program);
        if (nuxt) {
          if (config) check(config, config);
          return;
        }
        if (!config) return;
        const bindings = importBindings(program);
        for (const plugin of pluginCalls(config)) {
          const call = importedCall(
            plugin,
            bindings,
            "default",
            (source) => source === "@analogjs/platform",
          );
          if (!call) continue;
          if (call.arguments.length === 0)
            context.report({ node: call, messageId: "preset", data: { page } });
          else {
            const options = optionsOf(call);
            if (options) check(options, options);
          }
        }
      },
    };
  },
});
