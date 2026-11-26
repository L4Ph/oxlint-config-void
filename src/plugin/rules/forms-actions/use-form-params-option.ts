import { importBindings, isCallOf, staticString } from "../../lib/ast.ts";
import {
  ADAPTERS,
  formOptions,
  hasSpread,
  importsFrom,
  isClientFile,
  propertyNamed,
} from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/pages-routing/actions-and-forms.md §useForm: "For dynamic routes, pass `params`
 * in the options". Checked when the URL is a string that spells out a `[param]` segment
 * and the options are absent or an object literal without `params`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass params in useForm's options when its URL has a [param] segment.",
      norms: ["pages-routing/actions-and-forms/9"],
      scope: "void",
    },
    messages: {
      params:
        "`useForm('{{url}}')` has a `[param]` segment but no `params` in its options. Add `{ params: { id } }` as the third argument. See guide/pages-routing/actions-and-forms.md (useForm).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (!importsFrom(bindings, ADAPTERS)) return {};
    return {
      CallExpression(node) {
        if (!isCallOf(node, "useForm", ADAPTERS, bindings)) return;
        const first = node.arguments[0];
        const url = first && staticString(first);
        if (!url || !/\[[^\]]+\]/.test(url)) return;
        const options = formOptions(node);
        if (options && (options.type !== "ObjectExpression" || hasSpread(options))) return;
        if (options && propertyNamed(options, "params")) return;
        context.report({ node, messageId: "params", data: { url } });
      },
    };
  },
});
