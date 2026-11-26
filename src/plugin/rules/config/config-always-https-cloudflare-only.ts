import { staticString, unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const OTHER_TARGETS = ["node", "bun", "deno"];

/** `routing.alwaysUseHttps` "Requires the Cloudflare target" (reference/config.md:389). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Use routing.alwaysUseHttps only when the target is Cloudflare.",
      norms: ["reference/config/42"],
      scope: "void",
    },
    messages: {
      cloudflareOnly:
        "`routing.alwaysUseHttps` needs the Cloudflare target, and this config sets `target: '{{target}}'`. Remove `alwaysUseHttps` and redirect to HTTPS where the app runs, or set `target: 'cloudflare'`. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const targetProperty = at(config, "target");
        const target = targetProperty === null ? null : staticString(targetProperty.value);
        if (target === null || !OTHER_TARGETS.includes(target)) return;
        const https = at(config, "routing.alwaysUseHttps");
        if (https === null) return;
        const value = unwrap(https.value);
        if (value.type !== "Literal" || value.value !== true) return;
        context.report({ node: https, messageId: "cloudflareOnly", data: { target } });
      },
    };
  },
});
