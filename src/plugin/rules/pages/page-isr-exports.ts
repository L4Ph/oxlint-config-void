import type { ESTree } from "vite-plus/lint/plugins";
import { unwrap } from "../../lib/ast.ts";
import { isSsrEntry } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * Void reads `prerender`, `ssr` and `revalidate` from a `.server` file without running it:
 * "Export `ssr` and `prerender` directly ... as `true` or `false`. Computed values and
 * re-exports are ignored with a warning" (guide/pages-routing/overview.md:157), and
 * "Use a whole number such as `3600` directly in the export" (guide/edge/revalidation.md:65).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export prerender and ssr as true or false, and revalidate as a whole number, written directly in the page's .server file.",
      norms: [
        "guide-core/ssg/2",
        "guide-core/ssg/10",
        "edge-integrations/prerendering/2",
        "reference/config/18",
        "edge-integrations/revalidation/8",
        "edge-integrations/prerendering/14",
      ],
      scope: "void",
    },
    messages: {
      boolean:
        "Void ignores `{{name}}` unless it is written as `export const {{name}} = true` or `= false`: it does not run the module to read it. Write the boolean literal. See guide/pages-routing/overview.md.",
      wholeNumber:
        "Void ignores `revalidate` unless it is a whole number written in the export, such as `export const revalidate = 3600`; an expression like `60 * 60` is skipped with a warning. Write the number. See guide/edge/revalidation.md.",
      reexport:
        "Void does not follow `{{name}}` through a re-export or a renamed export. Declare it here: `export const {{name}} = ...;`. See guide/pages-routing/overview.md.",
      zero: "`prerender = true` with `revalidate = 0` prerenders nothing: only paths with a positive revalidate TTL are prerendered. Remove one of the two, or set a positive TTL. See guide/edge/prerendering.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    const page = file.dir === "pages" && kind.serverCompanion && !kind.private && !kind.test;
    if (!page && !isSsrEntry(file)) return {};
    return {
      Program(program) {
        let prerender: boolean | null = null;
        let revalidate: number | null = null;
        let revalidateNode: Node | null = null;
        for (const statement of program.body) {
          if (statement.type !== "ExportNamedDeclaration") continue;
          if (statement.declaration?.type === "VariableDeclaration") {
            for (const declarator of statement.declaration.declarations) {
              if (declarator.id.type !== "Identifier") continue;
              const name = declarator.id.name;
              const init = declarator.init ? unwrap(declarator.init as Node) : null;
              if (name === "prerender" || name === "ssr") {
                if (init?.type === "Literal" && typeof init.value === "boolean") {
                  if (name === "prerender") prerender = init.value;
                } else
                  context.report({
                    node: init ?? declarator,
                    messageId: "boolean",
                    data: { name },
                  });
              } else if (name === "revalidate" && page) {
                if (
                  init?.type === "Literal" &&
                  typeof init.value === "number" &&
                  Number.isInteger(init.value) &&
                  init.value >= 0
                ) {
                  revalidate = init.value;
                  revalidateNode = init;
                } else context.report({ node: init ?? declarator, messageId: "wholeNumber" });
              }
            }
          }
          for (const specifier of statement.specifiers) {
            const exported =
              specifier.exported.type === "Identifier"
                ? specifier.exported.name
                : String(specifier.exported.value);
            const local =
              specifier.local.type === "Identifier"
                ? specifier.local.name
                : String(specifier.local.value);
            const watched =
              exported === "prerender" || exported === "ssr" || (page && exported === "revalidate");
            if (watched && (statement.source || local !== exported))
              context.report({ node: specifier, messageId: "reexport", data: { name: exported } });
          }
        }
        if (page && prerender === true && revalidate === 0 && revalidateNode)
          context.report({ node: revalidateNode, messageId: "zero" });
      },
    };
  },
});
