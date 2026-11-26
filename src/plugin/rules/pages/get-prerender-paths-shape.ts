import type { ESTree } from "vite-plus/lint/plugins";
import { namedExports, staticString, unwrap } from "../../lib/ast.ts";
import {
  dynamicParams,
  isTypeScript,
  keyName,
  mentionsType,
  returnedValues,
  topLevelFunction,
} from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * guide/edge/prerendering.md and guide/ssg.md: a dynamic page's `getPrerenderPaths()` is
 * annotated `Promise<PageParams<P>[]>` and returns one object per path, with every
 * parameter of the file path as a string or number. A page with no parameter does not
 * need it. Only an array literal of object literals is checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Annotate getPrerenderPaths() with PageParams in a dynamic page, and return one object per path with exactly the page's parameters.",
      norms: [
        "reference/types/6",
        "guide-core/type-safety/12",
        "edge-integrations/prerendering/5",
        "edge-integrations/prerendering/3",
        "edge-integrations/prerendering/6",
        "edge-integrations/prerendering/7",
        "guide-core/ssg/6",
      ],
      scope: "void",
    },
    messages: {
      annotation:
        "`getPrerenderPaths()` has no return type that mentions `PageParams`, so TypeScript cannot check the parameter names. Annotate it: `Promise<PageParams<'/pattern'>[]>`, with `PageParams` imported from 'void/routes'. See guide/edge/prerendering.md.",
      unneeded:
        "`{{path}}` has no dynamic segment, so it has nothing to choose paths for. Remove `getPrerenderPaths()`; `export const prerender = true` is enough. See guide/edge/prerendering.md.",
      missingParam:
        "This path object lacks `{{name}}`, a parameter of `{{path}}`. Return every required parameter, as a string or number. See guide/edge/prerendering.md.",
      unknownParam:
        "`{{name}}` is not a parameter of `{{path}}`. Use only the names in the file path's brackets. See guide/edge/prerendering.md.",
      badValue:
        "A parameter value is a string or a number; Void URL-encodes it. Return `{{name}}` as one of those. See guide/ssg.md.",
      slash:
        "`{{name}}` is a single [param] segment, and a value with `/` cannot fill it. Rename the file to a catch-all such as `[...{{name}}].server.ts`. See guide/edge/prerendering.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    const params = dynamicParams(file.segments);
    return {
      Program(program) {
        const found = namedExports(program).get("getPrerenderPaths");
        if (!found) return;
        if (!params.dynamic) {
          context.report({ node: found.node, messageId: "unneeded", data: { path: file.path } });
          return;
        }
        const declared = found.node.type === "FunctionDeclaration" ? found.node : null;
        const fn = declared ?? topLevelFunction(program, "getPrerenderPaths");
        if (isTypeScript(file.name)) {
          const returnType = fn?.returnType ?? null;
          const variable =
            found.node.type === "VariableDeclarator" ? found.node.id.typeAnnotation : null;
          if (
            (fn || variable) &&
            !mentionsType(returnType, "PageParams") &&
            !mentionsType(variable, "PageParams")
          )
            context.report({ node: fn ?? found.node, messageId: "annotation" });
        }
        if (!fn || !params.ok) return;
        const names = [...params.plain, ...params.catchAll];
        for (const value of returnedValues(fn)) {
          const array = unwrap(value);
          if (array.type !== "ArrayExpression") continue;
          for (const element of array.elements) {
            if (element === null || element.type === "SpreadElement") continue;
            const entry = unwrap(element as Node);
            if (entry.type !== "ObjectExpression") {
              if (entry.type === "Literal")
                context.report({
                  node: entry,
                  messageId: "badValue",
                  data: { name: names.join(", ") },
                });
              continue;
            }
            const seen = new Set<string>();
            let open = false;
            for (const member of entry.properties) {
              if (member.type !== "Property") {
                open = true;
                continue;
              }
              const name = keyName(member);
              if (name === null) {
                open = true;
                continue;
              }
              seen.add(name);
              if (!names.includes(name)) {
                context.report({
                  node: member,
                  messageId: "unknownParam",
                  data: { name, path: file.path },
                });
                continue;
              }
              const text = staticString(member.value as Node);
              const literal = unwrap(member.value as Node);
              if (
                (literal.type === "Literal" &&
                  typeof literal.value !== "string" &&
                  typeof literal.value !== "number") ||
                literal.type === "ObjectExpression" ||
                literal.type === "ArrayExpression"
              )
                context.report({ node: member.value, messageId: "badValue", data: { name } });
              else if (text !== null && text.includes("/") && params.plain.includes(name))
                context.report({ node: member.value, messageId: "slash", data: { name } });
            }
            if (!open)
              for (const name of names)
                if (!seen.has(name))
                  context.report({
                    node: entry,
                    messageId: "missingParam",
                    data: { name, path: file.path },
                  });
          }
        }
      },
    };
  },
});
