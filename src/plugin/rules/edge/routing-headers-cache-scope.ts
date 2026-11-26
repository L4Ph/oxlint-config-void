import { staticString, unwrap } from "../../lib/ast.ts";
import { configObject, isVoidConfig, keyName, members, objectAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/** Patterns that cover signed-in pages or `/api/auth/*`. */
const SIGNED_IN = ["/*", "/api/*", "/api/auth/*"];
/** Patterns that cover URLs whose content changes without the URL changing. */
const UNHASHED = [...SIGNED_IN, "/*.html"];

/**
 * "Keep public cache rules away from signed-in pages and `/api/auth/*`", and "Use immutable
 * caching only for URLs that change with their content"
 * (guide/edge/headers.md:28-29, guide/edge/static-assets.md:39).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not give a public or immutable Cache-Control rule to a pattern that covers signed-in pages, /api/auth/*, or every URL.",
      norms: [
        "edge-integrations/headers/5",
        "edge-integrations/headers/6",
        "edge-integrations/static-assets/3",
      ],
      scope: "void",
    },
    messages: {
      public:
        "`{{header}}` under '{{pattern}}' makes a shared cache keep responses that include signed-in pages and `/api/auth/*`. Give the public rule a narrower pattern such as '/assets/*'. See guide/edge/headers.md.",
      immutable:
        "`{{header}}` under '{{pattern}}' makes every matching URL immutable, including pages and missing files whose content changes under the same URL. Use `immutable` only for content-hashed paths such as '/assets/*'. See guide/edge/static-assets.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const headers = config === null ? null : objectAt(config, "routing.headers");
        if (headers === null) return;
        for (const member of members(headers).props) {
          const pattern = keyName(member) ?? "";
          const list = unwrap(member.value);
          if (list.type !== "ArrayExpression") continue;
          for (const element of list.elements) {
            if (element === null || element.type === "SpreadElement") continue;
            const header = staticString(element);
            if (header === null || !/^\s*cache-control\s*:/i.test(header)) continue;
            if (SIGNED_IN.includes(pattern) && /\b(?:public|s-maxage)\b/i.test(header))
              context.report({ node: element, messageId: "public", data: { header, pattern } });
            else if (UNHASHED.includes(pattern) && /\bimmutable\b/i.test(header))
              context.report({ node: element, messageId: "immutable", data: { header, pattern } });
          }
        }
      },
    };
  },
});
