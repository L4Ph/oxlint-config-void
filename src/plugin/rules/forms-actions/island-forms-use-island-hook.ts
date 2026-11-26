import { importBindings, isCallOf } from "../../lib/ast.ts";
import { ADAPTERS, initOf, memberName, strip } from "../../lib/forms-actions.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const SUBMIT = new Set(["post", "put", "patch", "delete"]);

/**
 * guide/pages-routing/islands.md §Forms: an island has no Void Router, so its forms use
 * `useIslandForm`, whose submit helpers take the action URL. Only files named
 * `*.island.*` are checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use useIslandForm, and pass the action URL to its submit helper, in *.island.* files.",
      norms: ["pages-routing/islands/10", "pages-routing/islands/11"],
      scope: "void",
    },
    messages: {
      hook: "`{{name}}` needs the Void Router, which island pages do not have. Use `useIslandForm` from the same package. See guide/pages-routing/islands.md (Forms).",
      url: "`form.{{method}}()` of `useIslandForm` takes the action URL: write `form.{{method}}('/blog')`. See guide/pages-routing/islands.md (Forms).",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !describe(file).island) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      ImportDeclaration(node) {
        if (!(ADAPTERS as readonly string[]).includes(String(node.source.value))) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name = bindings.get(specifier.local.name)?.imported;
          if (name === "useForm" || name === "Form")
            context.report({ node: specifier, messageId: "hook", data: { name } });
        }
      },
      CallExpression(node) {
        const callee = strip(node.callee);
        const method = memberName(callee);
        if (callee.type !== "MemberExpression" || method === null || !SUBMIT.has(method)) return;
        if (node.arguments.length > 0 || callee.object.type !== "Identifier") return;
        const init = initOf(context, callee.object);
        if (init !== null && isCallOf(strip(init), "useIslandForm", ADAPTERS, bindings))
          context.report({ node, messageId: "url", data: { method } });
      },
    };
  },
});
