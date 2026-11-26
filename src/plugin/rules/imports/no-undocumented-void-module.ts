import { moduleSpecifiers } from "../../lib/handlers.ts";
import { PUBLIC_MODULES } from "../../lib/imports.ts";
import { defineRule } from "../../rule.ts";

const PUBLIC = new Set(PUBLIC_MODULES);

/** reference/api.md:36: "Import Void's app-facing APIs from these paths:" (the table that follows). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import Void only from the paths the documentation names as public.",
      norms: ["reference/api-index/1"],
      scope: "any",
    },
    messages: {
      undocumented:
        "`{{specifier}}` is not an import path Void documents. Use one of the paths listed in reference/api.md (for example `void`, `void/db`, `void/env`).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program)) {
          const specifier = String(node.value);
          if ((specifier === "void" || specifier.startsWith("void/")) && !PUBLIC.has(specifier))
            context.report({ node, messageId: "undocumented", data: { specifier } });
        }
      },
    };
  },
});
