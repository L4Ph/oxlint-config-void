import type { ESTree } from "vite-plus/lint/plugins";
import { defineRule } from "../../rule.ts";
import { variableOf } from "../../lib/forms-actions.ts";
import { describe, locate } from "../../lib/project.ts";

/** The path a `fetch` argument spells out at its start: a string, or a template's first chunk. */
function leadingPath(node: ESTree.Node): string | null {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral") return node.quasis[0]?.value.cooked ?? null;
  return null;
}

/**
 * guide/typed-fetch.md and reference/api/client.md: your own routes are called with
 * `fetch` from `void/client`. The rule cannot know which paths are Void routes, so it
 * keeps to the one place the docs put them: paths under `/api/` (not `/api/auth/`, which
 * Better Auth serves), called with the global `fetch` in browser code.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Call your own /api routes with fetch from 'void/client', not the global fetch.",
      norms: ["reference/client/1", "guide-core/quickstart/5", "guide-core/typed-fetch/1"],
      scope: "void",
    },
    messages: {
      global:
        "The global `fetch` does not check `{{path}}` against your routes or type its response. Use `import { fetch } from 'void/client'`. See guide/typed-fetch.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.convention !== "pages" || kind.serverCompanion || kind.test) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "fetch") return;
        if ((variableOf(context, callee)?.defs.length ?? 0) > 0) return; // imported or declared here
        const first = node.arguments[0];
        const path = first ? leadingPath(first) : null;
        if (path === null || !path.startsWith("/api/") || path.startsWith("/api/auth/")) return;
        if (first?.type === "Literal" && /\.[a-z0-9]+$/i.test(path.split("?")[0] ?? "")) return;
        context.report({ node, messageId: "global", data: { path } });
      },
    };
  },
});
