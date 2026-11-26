import { importBindings, isCallOf } from "../../lib/ast.ts";
import { ADAPTERS, importsFrom, isClientFile, strip } from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/pages-routing/actions-and-forms.md §Actions: `action()` returns `{ ok: true,
 * pageData }` or `{ ok: false, error }`. Only the form the docs' own text rules out is
 * reported: a bound result whose `pageData` is read and which is never checked. A bare
 * `await action(...)` statement is not reported, because the docs' examples of query
 * parameters and scroll write exactly that.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Check the ok / error of an action() result before using its pageData.",
      norms: ["pages-routing/actions-and-forms/20"],
      scope: "void",
    },
    messages: {
      unchecked:
        "`pageData` of this `action()` result is read, but `.ok` and `.error` never are. An expected failure returns `{ ok: false, error }` with no `pageData`; test `result.ok` first (`if (!result.ok) showToast(result.error.message)`). See guide/pages-routing/actions-and-forms.md (Actions).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (!importsFrom(bindings, ADAPTERS)) return {};
    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !node.init) return;
        const awaited = strip(node.init);
        if (awaited.type !== "AwaitExpression") return;
        const call = strip(awaited.argument);
        if (!isCallOf(call, "action", ADAPTERS, bindings)) return;

        const variable = context.sourceCode.getDeclaredVariables(node)[0];
        if (!variable) return;
        let reads = 0;
        for (const reference of variable.references) {
          if (reference.init) continue;
          const parent = reference.identifier.parent;
          if (
            parent.type !== "MemberExpression" ||
            parent.object !== reference.identifier ||
            parent.computed ||
            parent.property.type !== "Identifier"
          )
            return; // passed on, returned, destructured, narrowed another way
          if (parent.property.name !== "pageData") return; // `.ok`, `.error`: checked
          reads++;
        }
        if (reads > 0) context.report({ node: call, messageId: "unchecked" });
      },
    };
  },
});
