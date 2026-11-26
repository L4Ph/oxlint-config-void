import { staticString } from "../../lib/ast.ts";
import {
  at,
  configObject,
  isVoidConfig,
  keyName,
  members,
  objectAt,
  stringAt,
} from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * "SPA apps already fall back to `/index.html`... You don't need to add `'/*':
 * '/index.html'` yourself" (guide/edge/rewrites.md:95).
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Do not add '/*': '/index.html' to routing.fallbacks in an SPA app.",
      norms: ["edge-integrations/rewrites/15"],
      scope: "void",
    },
    messages: {
      spa: "This app is an SPA, which already falls back to `/index.html`. Remove the `'/*': '/index.html'` fallback. See guide/edge/rewrites.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    const settings = context.settings?.void as { appType?: string } | undefined;
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const appType = stringAt(config, "inference.appType") ?? settings?.appType;
        if (appType !== "spa") return;
        const fallbacks = objectAt(config, "routing.fallbacks");
        if (fallbacks === null) return;
        for (const member of members(fallbacks).props)
          if (
            keyName(member) === "/*" &&
            staticString(member.value) === "/index.html" &&
            at(config, "routing.fallbacks") !== null
          )
            context.report({ node: member, messageId: "spa" });
      },
    };
  },
});
