import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf } from "../../lib/ast.ts";
import {
  ADAPTERS,
  formOptions,
  importsFrom,
  isClientFile,
  memberName,
  propertyNamed,
  strip,
  walk,
} from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/pages-routing/actions-and-forms.md §Validation Errors: `isVoidActionError()`
 * narrows an action error before its `status` is read. Checked: the parameter of a
 * `catch` whose `try` calls `action()`, and the parameter of `useForm`'s `onError`.
 * The binding must only ever be used as `error.<name>`: any other use (a type guard, a
 * logger, `instanceof`) may be the narrowing, so the rule keeps silent.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Narrow a caught action error with isVoidActionError() before reading its status.",
      norms: ["pages-routing/actions-and-forms/22"],
      scope: "void",
    },
    messages: {
      narrow:
        "`{{name}}.status` is read on an error that is not narrowed. Wrap it in `if (isVoidActionError({{name}}))`, imported from the same package as `action`. See guide/pages-routing/actions-and-forms.md (Validation Errors).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (!importsFrom(bindings, ADAPTERS)) return {};

    function check(owner: ESTree.Node, param: ESTree.Node | null | undefined) {
      if (!param || param.type !== "Identifier") return;
      const variable = context.sourceCode
        .getDeclaredVariables(owner)
        .find((v) => v.name === param.name);
      if (!variable) return;
      const found: ESTree.Node[] = [];
      for (const reference of variable.references) {
        const parent = reference.identifier.parent;
        if (
          parent.type !== "MemberExpression" ||
          parent.object !== reference.identifier ||
          parent.computed
        )
          return;
        if (memberName(parent) === "status") found.push(parent);
      }
      for (const node of found)
        context.report({ node, messageId: "narrow", data: { name: param.name } });
    }

    return {
      CatchClause(node) {
        const attempt = node.parent;
        if (attempt.type !== "TryStatement") return;
        let calls = false;
        walk(attempt.block, (n) => {
          if (n.type === "CallExpression" && isCallOf(n, "action", ADAPTERS, bindings))
            calls = true;
        });
        if (calls) check(node, node.param);
      },
      CallExpression(node) {
        if (!isCallOf(node, "useForm", ADAPTERS, bindings)) return;
        const options = formOptions(node);
        const handler = options && propertyNamed(options, "onError")?.value;
        if (!handler) return;
        const fn = strip(handler);
        if (fn.type === "ArrowFunctionExpression" || fn.type === "FunctionExpression")
          check(fn, fn.params[0]);
      },
    };
  },
});
