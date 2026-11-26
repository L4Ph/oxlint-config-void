import { calleeName, importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { contains, handlerFunctions, walk, type HandlerFn } from "../../lib/edge.ts";
import { defineRule } from "../../rule.ts";

/** Reads of the context that tell a rewritten request from the original one. */
const GUARDS = ["isRewritten", "originalUrl", "req.path", "req.url", "req.routePath"];

/**
 * `c.rewrite()` (guide/edge/rewrites.md:50, reference/api/rewrites.md:12): "Return the result
 * of `c.rewrite()`. Middleware runs again at the destination, so skip paths that are already
 * rewritten to avoid a loop", and "`destination` must start with `/`".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Return the result of c.rewrite(), skip already-rewritten requests in middleware, and give it a destination that starts with '/'.",
      norms: [
        "edge-integrations/rewrites/7",
        "edge-integrations/rewrites/8",
        "reference/rewrites/1",
      ],
      scope: "void",
    },
    messages: {
      notReturned:
        "The result of `{{name}}.rewrite()` is dropped, so the request is not served from the destination. Write `return {{name}}.rewrite(...)`. See guide/edge/rewrites.md.",
      loop: "This middleware calls `{{name}}.rewrite()` without first checking whether the request was already rewritten. Middleware runs again at the destination, so it loops. Return early with `if ({{name}}.isRewritten()) return next();` or a check on `{{name}}.req.path`. See guide/edge/rewrites.md.",
      destination:
        "`{{name}}.rewrite('{{value}}')` is not a path of this app. The destination must start with a single `/`. See reference/api/rewrites.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    const handlers: HandlerFn[] = [];
    const ownerOf = (node: Parameters<typeof contains>[1], name: string) =>
      handlers.findLast((handler) => handler.name === name && contains(handler.fn, node));
    const rewriteName = (node: Parameters<typeof contains>[1]) => {
      if (node.type !== "CallExpression") return null;
      const callee = node.callee;
      if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "rewrite"
      )
        return callee.object.name;
      return null;
    };
    return {
      ExpressionStatement(node) {
        let call = unwrap(node.expression);
        if (call.type === "AwaitExpression") call = unwrap(call.argument);
        const name = rewriteName(call);
        if (name !== null && ownerOf(call, name))
          context.report({ node, messageId: "notReturned", data: { name } });
      },
      CallExpression(node) {
        handlers.push(...handlerFunctions(node, bindings));
        const name = rewriteName(node);
        if (name === null) return;
        const owner = ownerOf(node, name);
        if (owner === undefined) return;
        const argument = node.arguments[0];
        if (argument !== undefined && argument.type !== "SpreadElement") {
          const value = unwrap(argument);
          const text =
            value.type === "TemplateLiteral"
              ? (value.quasis[0]?.value.cooked ?? "")
              : staticString(value);
          // A template that starts with an expression is not known.
          if (text !== null && text !== "" && (!text.startsWith("/") || text.startsWith("//")))
            context.report({
              node: argument,
              messageId: "destination",
              data: { name, value: text },
            });
        }
        if (owner.middleware && !guarded(owner, node)) {
          context.report({ node, messageId: "loop", data: { name } });
        }
      },
    };
  },
});

/** True when, before `call`, the middleware reads something that tells a rewritten request apart. */
function guarded(owner: HandlerFn, call: Parameters<typeof contains>[1]): boolean {
  let found = false;
  if (owner.fn.body === null || owner.fn.body === undefined) return false;
  walk(owner.fn.body, (node) => {
    if (found || node.range[0] >= call.range[0]) return;
    if (node.type === "MemberExpression") {
      const text = calleeName(node);
      found = GUARDS.some((guard) => text === `${owner.name}.${guard}`);
    } else if (node.type === "CallExpression") {
      // The context handed to a helper may be checked there.
      found = node.arguments.some(
        (argument) =>
          (argument.type === "Identifier" && argument.name === owner.name) ||
          calleeName(argument) === `${owner.name}.req`,
      );
    } else if (
      node.type === "VariableDeclarator" &&
      node.id.type === "ObjectPattern" &&
      node.init
    ) {
      found =
        node.init.type === "Identifier"
          ? node.init.name === owner.name
          : calleeName(node.init) === `${owner.name}.req`;
    }
  });
  return found;
}
