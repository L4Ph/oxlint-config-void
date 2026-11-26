import { namedExports } from "../../lib/ast.ts";
import { dynamicParams } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "For a dynamic page, export `getPrerenderPaths()` to choose which paths to render"
 * (guide/edge/prerendering.md); without it the page is not prerendered (guide/ssg.md).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "A dynamic page that exports prerender = true also exports getPrerenderPaths() from the same .server file.",
      norms: ["edge-integrations/prerendering/4", "guide-core/ssg/3", "reference/config/17"],
      scope: "void",
    },
    messages: {
      missing:
        "`{{path}}` has a dynamic segment and exports `prerender = true`, but no `getPrerenderPaths()`, so Void has no paths to render. Export `async function getPrerenderPaths(): Promise<PageParams<'/pattern'>[]>` from this file. See guide/edge/prerendering.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    if (!dynamicParams(file.segments).dynamic) return {};
    return {
      Program(program) {
        if (program.body.some((statement) => statement.type === "ExportAllDeclaration")) return;
        const exports = namedExports(program);
        const prerender = exports.get("prerender");
        if (!prerender?.init || exports.has("getPrerenderPaths")) return;
        if (prerender.init.type === "Literal" && prerender.init.value === true)
          context.report({ node: prerender.node, messageId: "missing", data: { path: file.path } });
      },
    };
  },
});
