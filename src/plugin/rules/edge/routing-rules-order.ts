import { shadowedKeys } from "../../lib/edge.ts";
import { configObject, isVoidConfig, keyName, objectAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * "When multiple rules match, the first match wins. Put specific patterns before catch-all
 * patterns" (guide/edge/redirects.md:28, guide/edge/rewrites.md:32,
 * guide/edge/revalidation.md:45).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put specific patterns before catch-alls in routing.redirects, routing.rewrites and routing.revalidate.",
      norms: [
        "edge-integrations/redirects/6",
        "edge-integrations/rewrites/4",
        "edge-integrations/revalidation/5",
      ],
      scope: "void",
    },
    messages: {
      shadowed:
        "'{{key}}' in `routing.{{option}}` never applies: the first match wins, and '{{earlier}}' above it already matches every URL this one does. Move '{{key}}' above '{{earlier}}'. See guide/edge/{{page}}.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    const pages: Record<string, string> = {
      redirects: "redirects",
      rewrites: "rewrites",
      revalidate: "revalidation",
    };
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        for (const option of Object.keys(pages)) {
          const rules = objectAt(config, `routing.${option}`);
          if (rules === null) continue;
          // A spread or a computed key can hold rules the file does not show: judge what comes before it.
          const entries: { key: string; node: (typeof rules.properties)[number] }[] = [];
          for (const member of rules.properties) {
            const key = member.type === "Property" ? keyName(member) : null;
            if (key === null) break;
            entries.push({ key, node: member });
          }
          for (const { entry, by } of shadowedKeys(entries))
            context.report({
              node: entry.node,
              messageId: "shadowed",
              data: { key: entry.key, option, earlier: by.key, page: pages[option] ?? "" },
            });
        }
      },
    };
  },
});
