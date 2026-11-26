import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, property, staticString } from "../../lib/ast.ts";
import {
  type AnyFunction,
  hasSpread,
  initOf,
  isClientFile,
  isFunction,
  memberName,
  strip,
} from "../../lib/forms-actions.ts";
import { defineRule } from "../../rule.ts";

/**
 * reference/api/pages.md §React navigation completion: inside `startTransition`, a
 * `<form action>`, `useActionState` or an async `useForm()` callback, an awaited
 * `router.visit()` / `router.refresh()` takes `{ resolveOn: 'data' }`. Only those four
 * places are checked, and only the function that directly contains the `await`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass { resolveOn: 'data' } to an awaited router.visit() or router.refresh() inside startTransition, useActionState, a <form action> or a useForm callback.",
      norms: ["reference/pages/22", "pages-routing/actions-and-forms/12"],
      scope: "void",
    },
    messages: {
      resolveOn:
        "`await router.{{method}}()` inside {{where}} waits for React to commit, which this callback is part of. Pass `{ resolveOn: 'data' }` in the options. See reference/api/pages.md (React navigation completion).",
    },
    schema: [],
  },
  create(context) {
    if (!isClientFile(context)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "@void/react")) return {};

    const react = (call: ESTree.Node, name: string) => {
      if (call.type !== "CallExpression") return false;
      if (isCallOf(call, name, ["react"], bindings)) return true;
      const callee = call.callee;
      return (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        memberName(callee) === name &&
        bindings.get(callee.object.name)?.source === "react"
      );
    };

    /** Where the callback is used, or null when it is none of the four places. */
    function placeOf(fn: AnyFunction): string | null {
      const parent = fn.parent;
      if (parent.type === "CallExpression" && parent.arguments[0] === fn) {
        if (react(parent, "startTransition")) return "startTransition";
        if (react(parent, "useActionState")) return "useActionState";
      }
      if (parent.type === "Property" && parent.value === fn && !parent.computed) {
        const key = parent.key.type === "Identifier" ? parent.key.name : null;
        const object = parent.parent;
        const call = object.parent;
        if (
          (key === "onSuccess" || key === "onError") &&
          call?.type === "CallExpression" &&
          call.arguments[2] === object &&
          isCallOf(call, "useForm", ["@void/react"], bindings)
        )
          return `useForm's ${key}`;
      }
      if (parent.type === "JSXExpressionContainer") {
        const attribute = parent.parent;
        if (
          attribute.type === "JSXAttribute" &&
          attribute.name.type === "JSXIdentifier" &&
          attribute.name.name === "action" &&
          attribute.parent.type === "JSXOpeningElement" &&
          attribute.parent.name.type === "JSXIdentifier" &&
          attribute.parent.name.name === "form"
        )
          return "a <form action>";
      }
      return null;
    }

    return {
      AwaitExpression(node) {
        const call = strip(node.argument);
        if (call.type !== "CallExpression") return;
        const callee = strip(call.callee);
        const method = memberName(callee);
        if (callee.type !== "MemberExpression" || (method !== "visit" && method !== "refresh"))
          return;
        const init = callee.object.type === "Identifier" ? initOf(context, callee.object) : null;
        if (init === null || !isCallOf(strip(init), "useRouter", ["@void/react"], bindings)) return;

        const options = call.arguments[method === "visit" ? 1 : 0];
        if (options !== undefined) {
          const object = strip(options);
          if (object.type !== "ObjectExpression" || hasSpread(object)) return;
          const given = property(object, "resolveOn");
          if (given !== null && staticString(given.value) === "data") return;
          if (given !== null && staticString(given.value) === null) return;
        }

        let fn = node.parent;
        while (!isFunction(fn)) {
          if (fn.type === "Program") return;
          fn = fn.parent;
        }
        const where = placeOf(fn);
        if (where !== null)
          context.report({
            node: call,
            messageId: "resolveOn",
            data: { method: method ?? "", where },
          });
      },
    };
  },
});
