import { importBindings, property, unwrap } from "../../lib/ast.ts";
import { isCallTo, isFunction, localNames, walk } from "../../lib/handlers.ts";
import type { Fn } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

type Node = Parameters<typeof unwrap>[0];

const REQUEST_READS = new Set(["query", "queries", "header", "headers", "param", "params"]);

/** Names the second parameter of a handler brings into scope: `(c, input)` or `(c, { query })`. */
function inputNames(fn: Fn): Set<string> {
  const names = new Set<string>();
  const second = fn.params[1];
  if (second?.type === "Identifier") names.add(second.name);
  else if (second?.type === "ObjectPattern")
    for (const member of second.properties) {
      if (member.type !== "Property") continue;
      const value = member.value.type === "AssignmentPattern" ? member.value.left : member.value;
      if (value.type === "Identifier") names.add(value.name);
    }
  return names;
}

/** True when the expression is, or is built directly from, a value the request supplies. */
function fromRequest(node: Node, inputs: Set<string>): boolean {
  const value = unwrap(node);
  switch (value.type) {
    case "AwaitExpression":
      return fromRequest(value.argument, inputs);
    case "CallExpression": {
      const callee = value.callee;
      if (callee.type !== "MemberExpression" || callee.computed) return false;
      const name = callee.property.type === "Identifier" ? callee.property.name : "";
      const viaReq =
        callee.object.type === "MemberExpression" &&
        callee.object.property.type === "Identifier" &&
        callee.object.property.name === "req";
      return (viaReq && REQUEST_READS.has(name)) || fromRequest(callee.object, inputs);
    }
    case "MemberExpression":
      return fromRequest(value.object, inputs);
    case "Identifier":
      return inputs.has(value.name);
    case "LogicalExpression":
    case "BinaryExpression":
      return fromRequest(value.left, inputs) || fromRequest(value.right, inputs);
    case "ConditionalExpression":
      return fromRequest(value.consequent, inputs) || fromRequest(value.alternate, inputs);
    case "TemplateLiteral":
      return value.expressions.some((expression) => fromRequest(expression, inputs));
    default:
      return false;
  }
}

/**
 * reference/api/auth.md:110: "Choose a trusted destination in your app; validate any URL
 * supplied by a user before passing it here." A value passed through a function or held in a
 * variable is taken to be validated.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass requireAuth a throwRedirect chosen by the app, never one taken from the request.",
      norms: ["reference/auth/12"],
      scope: "void",
    },
    messages: {
      fromRequest:
        "`throwRedirect` is taken straight from the request, so a visitor can send a signed-out user anywhere. Use a path of your app (`'/login'`), or validate the value first and pass the result. See reference/api/auth.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const require = localNames(importBindings(program), "requireAuth", ["void/auth"]);
        if (require.size === 0) return;
        const parents = new Map<Node, Node | null>();
        walk(program, (node, parent) => {
          parents.set(node, parent);
          if (!isCallTo(node, require)) return;
          const options = node.arguments[1];
          const redirect = options ? property(unwrap(options), "throwRedirect") : null;
          if (!redirect) return;
          let fn: Fn | null = null;
          for (let up = parent; up; up = parents.get(up) ?? null)
            if (isFunction(up)) {
              fn = up;
              break;
            }
          if (fromRequest(redirect.value, fn ? inputNames(fn) : new Set()))
            context.report({ node: redirect, messageId: "fromRequest" });
        });
      },
    };
  },
});
