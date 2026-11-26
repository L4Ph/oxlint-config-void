import { namedExports } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/** What a page's `.server` file exports for Void; a component file must not. */
const SERVER_ONLY = [
  "loader",
  "action",
  "actions",
  "head",
  "ssr",
  "prerender",
  "getPrerenderPaths",
  "revalidate",
];
/** What nothing but a page's `.server` file can export. */
const PAGE_ONLY = ["prerender", "getPrerenderPaths", "revalidate"];

/**
 * "Pair a page with a `.server.ts` file for server code" (guide/pages-routing/overview.md:100),
 * "Export `prerender = true` from the companion `.server.ts` file"
 * (guide/edge/prerendering.md:15), "you can export a `revalidate` value from a `.server.ts`
 * file" (guide/edge/revalidation.md:54). A helper module outside `pages/`, `routes/` and
 * `middleware/` may export any name, so only those directories are read.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export loader, action, head, ssr, prerender and revalidate from a page's .server companion, not from the page component or a route.",
      norms: [
        "pages-routing/overview/7",
        "pages-routing/overview/12",
        "guide-core/quickstart/3",
        "edge-integrations/prerendering/1",
        "edge-integrations/revalidation/7",
      ],
      scope: "void",
    },
    messages: {
      component:
        "`{{name}}` is exported from a page component, and Void reads it only from the page's companion. Move it to `{{companion}}`. See guide/pages-routing/overview.md.",
      elsewhere:
        "`{{name}}` is exported from `{{path}}`, and Void reads it only from a page's `.server` file. Move it to the companion of the page it is for (`pages/<page>.server.ts`). See guide/edge/prerendering.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.private || kind.test || kind.serverCompanion) return {};
    let names: string[];
    let messageId: "component" | "elsewhere";
    if (file.dir === "pages" && kind.pageComponent) {
      names = SERVER_ONLY;
      messageId = "component";
    } else if (file.dir === "routes" || file.dir === "middleware") {
      names = PAGE_ONLY;
      messageId = "elsewhere";
    } else return {};
    const companion = file.name.replace(/\.[^.]+$/, ".server.ts");
    return {
      Program(program) {
        const exports = namedExports(program);
        for (const name of names) {
          const found = exports.get(name);
          if (found)
            context.report({
              node: found.node,
              messageId,
              data: { name, companion, path: file.path },
            });
        }
      },
    };
  },
});
