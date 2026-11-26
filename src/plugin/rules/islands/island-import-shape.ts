import type { ESTree } from "vite-plus/lint/plugins";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const STRATEGY = /^(?:load|visible|idle|media:\(.+\))$/;

/** The `island` attribute of an import, with the string it holds (null when it is not a string). */
function islandAttribute(
  statement: ESTree.ImportDeclaration,
): { node: ESTree.ImportAttribute; value: string | null } | null {
  for (const attribute of statement.attributes ?? []) {
    const key = attribute.key;
    const name = key.type === "Identifier" ? key.name : String(key.value);
    if (name === "island")
      return {
        node: attribute,
        value: typeof attribute.value.value === "string" ? attribute.value.value : null,
      };
  }
  return null;
}

/**
 * guide/pages-routing/islands.md: components marked with `with { island: ... }` are named
 * with a leading `_` (line 17), so Void does not make a route of them; the page that marks
 * them is named `<name>.island.<ext>` (line 63); the value is one of the strategies of the
 * table at line 175.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Mark an island with a documented strategy, import it from a _-prefixed file, and do it in a .island page.",
      norms: ["pages-routing/islands/1", "pages-routing/islands/3", "pages-routing/islands/8"],
      scope: "void",
    },
    messages: {
      route:
        "`{{source}}` is imported as an island but lives in `pages/` without a leading `_`, so Void also serves it as a route. Rename it with a leading underscore (`_{{name}}`) or move it out of `pages/`. See guide/pages-routing/islands.md.",
      page: "This file marks an island, so it is an island page. Rename it `<name>.island.<ext>`. See guide/pages-routing/islands.md.",
      strategy:
        "`island: '{{value}}'` is not a strategy. Use 'load', 'visible', 'idle' or 'media:(query)', such as 'media:(max-width: 768px)'. See guide/pages-routing/islands.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (kind.serverCompanion || kind.test) return {};
    const own = file.segments.slice(0, -1);
    let reportedPage = false;
    return {
      ImportDeclaration(node) {
        const island = islandAttribute(node);
        if (!island) return;
        if (island.value !== null && !STRATEGY.test(island.value))
          context.report({
            node: island.node,
            messageId: "strategy",
            data: { value: island.value },
          });
        const source = String(node.source.value);
        if (source.startsWith(".")) {
          const resolved: string[] = [...own];
          for (const part of source.split("/")) {
            if (part === "..") resolved.pop();
            else if (part !== "." && part !== "") resolved.push(part);
          }
          // Outside `pages/`, or below a `_` name: not a route.
          const stillInPages = resolved[0] === "pages" && resolved.length > 1;
          if (stillInPages && !resolved.slice(1).some((part) => part.startsWith("_")))
            context.report({
              node: node.source,
              messageId: "route",
              data: { source, name: resolved[resolved.length - 1] ?? "" },
            });
        }
        if (!reportedPage && !kind.island && !kind.private && !kind.layout && kind.pageComponent) {
          reportedPage = true;
          context.report({ node, messageId: "page" });
        }
      },
    };
  },
});
