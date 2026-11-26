import { RESOURCE_MODULES } from "../../lib/imports.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/resource-inference.md:92: "Put server resource imports in these files or a page's
 * `.server.ts` companion; Vue and Svelte component files are not scanned directly."
 * Oxlint lints only the script block of an SFC, which is where an import can be.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not import Void's server resource modules from .vue or .svelte files.",
      norms: ["reference/resource-inference/8", "edge-integrations/frameworks-nuxt/10"],
      scope: "void",
    },
    messages: {
      resource:
        "`{{specifier}}` is a server resource, and Void does not scan `.vue` or `.svelte` files for it. Import it in the page's `.server.ts` companion and pass the data down as props. See reference/resource-inference.md.",
    },
    schema: [],
  },
  create(context) {
    if (!/\.(?:vue|svelte)$/.test(context.filename)) return {};
    return {
      ImportDeclaration(node) {
        const specifier = String(node.source.value);
        if (node.importKind !== "type" && RESOURCE_MODULES.includes(specifier))
          context.report({ node, messageId: "resource", data: { specifier } });
      },
    };
  },
});
