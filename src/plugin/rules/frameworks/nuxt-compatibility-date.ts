import { property, staticString, unwrap } from "../../lib/ast.ts";
import { configObject, isConfigFile } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

const MINIMUM = "2025-07-15";

/**
 * The Nuxt page: `cloudflare.dev` runs in development "when `compatibilityDate` is
 * `2025-07-15` or later". A config with no `compatibilityDate` is not reported: the page's
 * own example config sets none.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Set Nuxt's compatibilityDate to 2025-07-15 or later.",
      norms: ["edge-integrations/frameworks-nuxt/7"],
      scope: "framework:nuxt",
    },
    messages: {
      early: `\`compatibilityDate\` is {{date}}, before ${MINIMUM}, so Nuxt does not run \`cloudflare.dev\` and the development server has no bindings. Set it to '${MINIMUM}' or later. See integrations/frameworks/nuxt.md.`,
    },
    schema: [],
  },
  create(context) {
    if (!isConfigFile(context, "nuxt")) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const member = config && property(config, "compatibilityDate");
        if (!member) return;
        const date = staticString(unwrap(member.value));
        if (date !== null && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < MINIMUM)
          context.report({ node: member.value, messageId: "early", data: { date } });
      },
    };
  },
});
