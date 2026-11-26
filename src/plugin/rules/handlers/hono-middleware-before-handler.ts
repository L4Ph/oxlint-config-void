import { importBindings, unwrap } from "../../lib/ast.ts";
import { defineHandlerNames, isCallTo, isFunction, walk } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/** The Hono middleware factories the docs show (integrations/hono.md, guide/auth.md). */
const FACTORIES: Record<string, string> = {
  cache: "hono/cache",
  cors: "hono/cors",
  bearerAuth: "hono/bearer-auth",
  csrf: "hono/csrf",
  etag: "hono/etag",
};

/**
 * integrations/hono.md:29 and guide/server-routing.md:273: Hono middleware is passed to
 * `defineHandler` before the final handler. Hono helpers that are not middleware factories
 * (`stream` in integrations/hono.md:61) are called inside handlers, so only the factories
 * the docs show are checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass Hono middleware as a leading argument of defineHandler, with the handler last.",
      norms: ["edge-integrations/hono/3"],
      scope: "void",
    },
    messages: {
      insideHandler:
        "`{{name}}()` creates a middleware; calling it inside the handler does nothing. Pass it before the handler: `defineHandler({{name}}(…), (c) => …)`. See integrations/hono.md.",
      lastArgument:
        "`{{name}}()` is the last argument, so it is taken as the handler. Put it before the handler: `defineHandler({{name}}(…), (c) => …)`. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.convention !== "routes" || kind.private || kind.test) return {};
    return {
      Program(program) {
        const bindings = importBindings(program);
        const handler = defineHandlerNames(bindings);
        const factories = new Map<string, string>();
        for (const [local, binding] of bindings)
          if (FACTORIES[binding.imported] === binding.source)
            factories.set(local, binding.imported);
        if (handler.size === 0 || factories.size === 0) return;
        const factoryCall = (node: ReturnType<typeof unwrap>) =>
          node.type === "CallExpression" &&
          node.callee.type === "Identifier" &&
          factories.has(node.callee.name)
            ? (factories.get(node.callee.name) ?? null)
            : null;
        walk(program, (node) => {
          if (!isCallTo(node, handler)) return;
          const args = node.arguments;
          const last = args[args.length - 1];
          if (args.length > 1 && last) {
            const name = factoryCall(unwrap(last));
            if (name !== null)
              context.report({ node: last, messageId: "lastArgument", data: { name } });
          }
          for (const arg of args) {
            if (!isFunction(arg) || !arg.body) continue;
            walk(arg.body, (inner, parent) => {
              const name = factoryCall(inner);
              if (name === null) return;
              // `cors(opts)(c, next)` runs the middleware by hand.
              if (parent?.type === "CallExpression" && parent.callee === inner) return;
              context.report({ node: inner, messageId: "insideHandler", data: { name } });
            });
          }
          return false;
        });
      },
    };
  },
});
