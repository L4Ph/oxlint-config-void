import { importBindings, isCallOf } from "../../lib/ast.ts";
import {
  formOptions,
  isClientFile,
  isFunction,
  memberName,
  propertyNamed,
  strip,
  walk,
} from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/pages-routing/actions-and-forms.md §React submission callbacks: "Callbacks run
 * before React commits the updated UI, so use an effect or ref callback to focus an
 * element that appears after submission." Checked: `.focus()` called directly in
 * `useForm`'s `onSuccess` / `onError` (not in a function nested inside them).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not call .focus() in useForm's onSuccess or onError; use an effect or a ref callback.",
      norms: ["pages-routing/actions-and-forms/11"],
      scope: "void",
    },
    messages: {
      focus:
        "`.focus()` in `{{callback}}` runs before React commits the updated UI, so an element that appears after the submission does not exist yet. Focus it from a `useEffect` or a ref callback. See guide/pages-routing/actions-and-forms.md (React submission callbacks).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "@void/react")) return {};
    return {
      CallExpression(node) {
        if (!isCallOf(node, "useForm", ["@void/react"], bindings)) return;
        const options = formOptions(node);
        if (!options) return;
        for (const callback of ["onSuccess", "onError"]) {
          const value = propertyNamed(options, callback)?.value;
          const fn = value && strip(value);
          if (!fn || !isFunction(fn) || !fn.body) continue;
          walk(fn.body, (n) => {
            if (isFunction(n)) return false;
            if (n.type !== "CallExpression") return;
            const callee = strip(n.callee);
            if (memberName(callee) === "focus")
              context.report({ node: n, messageId: "focus", data: { callback } });
          });
        }
      },
    };
  },
});
