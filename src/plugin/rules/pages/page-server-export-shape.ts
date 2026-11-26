import type { ESTree } from "vite-plus/lint/plugins";
import { namedExports, unwrap } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const isPlainFunction = (node: Node): boolean =>
  node.type === "ArrowFunctionExpression" ||
  node.type === "FunctionExpression" ||
  node.type === "FunctionDeclaration";

/**
 * guide/pages-routing/loaders.md:8 and actions-and-forms.md:8: define `loader` and `action`
 * "with `defineHandler`"; actions-and-forms.md:272: "Use `action` or `actions` in a file,
 * not both." A handler imported or built by a call is not judged: only a function written
 * as the export itself, which skips `defineHandler`, is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Define a page's loader and action with defineHandler(), and export action or actions, not both.",
      norms: [
        "pages-routing/loaders/1",
        "pages-routing/actions-and-forms/2",
        "pages-routing/actions-and-forms/17",
        "reference/structure/7",
      ],
      scope: "void",
    },
    messages: {
      handler:
        "`{{name}}` is a plain function. Wrap it: `export const {{name}} = defineHandler((c) => { ... })`, with `defineHandler` imported from 'void', so Void gets the context, validation and typed props. See guide/pages-routing/loaders.md.",
      both: "This file exports `action` and `actions`. Keep one: `action` for a single mutation, or `actions = { name: defineHandler(...) }` for several. See guide/pages-routing/actions-and-forms.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private || kind.test) return {};
    return {
      Program(program) {
        const exports = namedExports(program);
        for (const name of ["loader", "action"]) {
          const found = exports.get(name);
          if (!found) continue;
          const init = found.init ? unwrap(found.init) : null;
          if (found.node.type === "FunctionDeclaration" || (init && isPlainFunction(init)))
            context.report({ node: found.node, messageId: "handler", data: { name } });
        }
        const actions = exports.get("actions")?.init;
        const object = actions ? unwrap(actions) : null;
        if (object?.type === "ObjectExpression")
          for (const member of object.properties)
            if (member.type === "Property" && isPlainFunction(unwrap(member.value as Node)))
              context.report({ node: member, messageId: "handler", data: { name: "actions" } });
        const action = exports.get("action");
        const plural = exports.get("actions");
        if (action && plural) {
          const later = action.node.range[0] > plural.node.range[0] ? action : plural;
          context.report({ node: later.node, messageId: "both" });
        }
      },
    };
  },
});
