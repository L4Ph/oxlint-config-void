import { importBindings } from "../../lib/ast.ts";
import { ADAPTER_RUNTIME } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const ROUTER = new Set(["Link", "useRouter", "useNavigation"]);

/**
 * "Island pages do not have a Void Router. Use regular `<a>` tags for navigation"
 * (guide/pages-routing/islands.md:356).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not use Link, useRouter or useNavigation in an island page; use a plain <a href>.",
      norms: ["pages-routing/islands/14"],
      scope: "void",
    },
    messages: {
      router:
        '`{{name}}` needs the Void Router, and an island page has none: it navigates with full page loads. Use `<a href="/path">` and drop this import. See guide/pages-routing/islands.md.',
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.island || kind.serverCompanion || kind.private || kind.test) return {};
    return {
      Program(program) {
        for (const binding of importBindings(program).values())
          if (
            !binding.typeOnly &&
            ADAPTER_RUNTIME.test(binding.source) &&
            ROUTER.has(binding.imported)
          )
            context.report({
              node: binding.node,
              messageId: "router",
              data: { name: binding.imported },
            });
      },
    };
  },
});
