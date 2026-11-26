import { valueAt } from "../../lib/ast.ts";
import { configObject, isConfigFile, stringArray } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * The Analog, Nuxt and Astro pages each list the `compatibility_flags` their app needs:
 * `nodejs_als` in all three, and `nodejs_compat` for Analog and Nuxt. Void's pages disagree
 * about whether the setting sits under `cloudflare` (the framework pages) or `worker`
 * (reference/config.md), so both are read. The rule cannot tell the three frameworks apart
 * from `void.config.ts`; it requires `nodejs_als` always, and `nodejs_compat` only when
 * `settings.void.framework` is `analog` or `nuxt`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "List nodejs_als (and, for Analog and Nuxt, nodejs_compat) in compatibility_flags of void.config.ts.",
      norms: [
        "edge-integrations/frameworks-analog/6",
        "edge-integrations/frameworks-nuxt/9",
        "edge-integrations/frameworks-astro/2",
      ],
      scope: "framework:analog,astro,nuxt",
    },
    messages: {
      missing:
        "`compatibility_flags` lacks {{flags}}, which `void/*` runtime helpers need under a meta-framework. Add it to the array. See integrations/frameworks/analog.md, nuxt.md and astro.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isConfigFile(context, "void")) return {};
    const framework = (context.settings as { void?: { framework?: unknown } }).void?.framework;
    const needed = [
      "nodejs_als",
      ...(framework === "analog" || framework === "nuxt" ? ["nodejs_compat"] : []),
    ];
    return {
      Program(program) {
        const config = configObject(program);
        if (!config) return;
        for (const place of ["cloudflare", "worker"]) {
          const array = valueAt(config, `${place}.compatibility_flags`);
          const flags = array ? stringArray(array) : null;
          if (!array || flags === null) continue;
          const missing = needed.filter((flag) => !flags.includes(flag));
          if (missing.length > 0)
            context.report({
              node: array,
              messageId: "missing",
              data: {
                flags: missing.map((flag) => `\`${flag}\``).join(" and "),
              },
            });
        }
      },
    };
  },
});
