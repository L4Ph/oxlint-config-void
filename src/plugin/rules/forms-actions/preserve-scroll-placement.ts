import { calleeName, importBindings, isCallOf } from "../../lib/ast.ts";
import {
  ADAPTERS,
  formOptions,
  importsFrom,
  isClientFile,
  memberName,
  propertyNamed,
  strip,
} from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

const SUBMIT = new Set(["post", "put", "patch", "delete"]);

/**
 * guide/pages-routing/actions-and-forms.md §Scroll after submission: "In React, set
 * `preserveScroll` in the third argument to `useForm()`. In Vue, Svelte, and Solid, pass
 * it to the submit method". The adapter is the package `useForm` is imported from.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put preserveScroll in useForm's options in React, and in the submit method's options in Vue, Svelte and Solid.",
      norms: ["pages-routing/actions-and-forms/14", "pages-routing/actions-and-forms/15"],
      scope: "void",
    },
    messages: {
      react:
        "In React `preserveScroll` goes in the third argument of `useForm()`, not in `form.{{method}}()`. See guide/pages-routing/actions-and-forms.md (Scroll after submission).",
      other:
        "In Vue, Svelte and Solid `preserveScroll` goes in the submit method (`form.post({ preserveScroll })`), not in the third argument of `useForm()`. See guide/pages-routing/actions-and-forms.md (Scroll after submission).",
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
        const root = calleeName(node)?.split(".")[0] ?? "";
        const react = bindings.get(root)?.source === "@void/react";
        if (!react) {
          const options = formOptions(node);
          const given = options && propertyNamed(options, "preserveScroll");
          if (given) context.report({ node: given, messageId: "other" });
          return;
        }
        const declarator = node.parent.type === "VariableDeclarator" ? node.parent : null;
        if (!declarator) return;
        const variable = context.sourceCode.getDeclaredVariables(declarator)[0];
        for (const reference of variable?.references ?? []) {
          const member = reference.identifier.parent;
          if (member.type !== "MemberExpression" || member.object !== reference.identifier)
            continue;
          const method = memberName(member);
          const call = member.parent;
          if (
            method === null ||
            !SUBMIT.has(method) ||
            call.type !== "CallExpression" ||
            call.callee !== member
          )
            continue;
          const argument = call.arguments[0] && strip(call.arguments[0]);
          const given = argument && propertyNamed(argument, "preserveScroll");
          if (given) context.report({ node: given, messageId: "react", data: { method } });
        }
      },
    };
  },
});
