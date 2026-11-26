import { staticString } from "../../lib/ast.ts";
import { configObject, isVoidConfig, keyName, members, objectAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Sources and destinations start with `/`. Destinations must be paths within the app", and
 * `:splat` takes the part a `*` matched (guide/edge/rewrites.md:30-31; reference/config.md:453;
 * a destination starts with a single `/`: reference/api/rewrites.md:12). `routing.fallbacks`
 * has "the same shape as `rewrites`" (reference/config.md:470).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Start every routing.rewrites and routing.fallbacks source and destination with a single '/', and use :splat only with a * source.",
      norms: [
        "reference/config/46",
        "edge-integrations/rewrites/2",
        "edge-integrations/rewrites/3",
      ],
      scope: "void",
    },
    messages: {
      path: "The {{role}} '{{value}}' in `routing.{{option}}` is not a path of this app. Start it with a single `/`; to send the visitor elsewhere, use `routing.redirects`. See guide/edge/rewrites.md.",
      splat:
        "The destination '{{to}}' uses `:splat`, but the source '{{key}}' has no `*` to capture. Add `*` to the source, or remove `:splat`. See guide/edge/rewrites.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        for (const option of ["rewrites", "fallbacks"]) {
          const rules = objectAt(config, `routing.${option}`);
          if (rules === null) continue;
          for (const member of members(rules).props) {
            const key = keyName(member) ?? "";
            const notPath = (text: string) => !text.startsWith("/") || text.startsWith("//");
            if (notPath(key))
              context.report({
                node: member,
                messageId: "path",
                data: { role: "source", value: key, option },
              });
            const to = staticString(member.value);
            if (to === null) continue;
            if (notPath(to))
              context.report({
                node: member.value,
                messageId: "path",
                data: { role: "destination", value: to, option },
              });
            else if (to.includes(":splat") && !key.includes("*"))
              context.report({ node: member.value, messageId: "splat", data: { key, to } });
          }
        }
      },
    };
  },
});
