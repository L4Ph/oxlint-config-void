import type { ESTree } from "vite-plus/lint/plugins";
import { namedExports, unwrap } from "../../lib/ast.ts";
import { isSsrEntry, mentionsType, returnedValues, topLevelFunction } from "../../lib/pages.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * guide/edge/prerendering.md:45: "In custom SSR mode (`src/main.ssr.ts`), export
 * `getPrerenderPaths()` at the top level. Since there's no file-based routing, return full
 * path strings".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In src/main.ssr, export getPrerenderPaths() at the top level and return full path strings.",
      norms: ["edge-integrations/prerendering/9", "edge-integrations/prerendering/10"],
      scope: "void",
    },
    messages: {
      notExported:
        "`getPrerenderPaths` is declared but not exported, so Void never calls it. Write `export` in front of it. See guide/edge/prerendering.md.",
      objects:
        "Custom SSR has no file-based routing, so `getPrerenderPaths()` returns full path strings such as '/blog/hello-world', typed `Promise<string[]>`, not parameter objects. See guide/edge/prerendering.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isSsrEntry(file)) return {};
    return {
      Program(program) {
        const fn = topLevelFunction(program, "getPrerenderPaths");
        const exported = namedExports(program).get("getPrerenderPaths");
        if (!exported) {
          const declared =
            fn ??
            program.body.find(
              (statement) =>
                statement.type === "VariableDeclaration" &&
                statement.declarations.some(
                  (declarator) =>
                    declarator.id.type === "Identifier" &&
                    declarator.id.name === "getPrerenderPaths",
                ),
            );
          if (declared) context.report({ node: declared, messageId: "notExported" });
          return;
        }
        if (!fn) return;
        if (fn.returnType && mentionsType(fn.returnType, "PageParams")) {
          context.report({ node: fn.returnType, messageId: "objects" });
          return;
        }
        for (const value of returnedValues(fn)) {
          const array = unwrap(value);
          if (array.type !== "ArrayExpression") continue;
          for (const element of array.elements)
            if (element?.type === "ObjectExpression")
              context.report({ node: element as Node, messageId: "objects" });
        }
      },
    };
  },
});
