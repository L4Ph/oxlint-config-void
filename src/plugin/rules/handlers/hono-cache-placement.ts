import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { defineHandlerNames, isCallTo, isFunction, localNames, walk } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const USER_READS = ["getUser", "getSession", "requireAuth", "getAuth"];

/**
 * integrations/hono.md:41: "`cache()` stores one response per URL and returns it to every
 * visitor. [...] Use it only on routes whose response is the same for everyone, never on a
 * route that reads the signed-in user. To cache pages, use revalidation."
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep hono/cache off pages and off routes that read the signed-in user.",
      norms: ["edge-integrations/hono/4", "edge-integrations/hono/5"],
      scope: "void",
    },
    messages: {
      userRoute:
        "`cache()` stores one response per URL and serves it to every visitor, but this handler reads the signed-in user. Remove `cache()` here, or stop reading the user. See integrations/hono.md.",
      page: "`hono/cache` is for routes, not pages. To cache a page, export `revalidate` from the page's `.server.ts`. See guide/edge/revalidation.md and integrations/hono.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.test) return {};
    if (kind.serverCompanion)
      return {
        ImportDeclaration(node) {
          if (node.source.value === "hono/cache" && node.importKind !== "type")
            context.report({ node: node.source, messageId: "page" });
        },
      };
    if (kind.convention !== "routes" || kind.private) return {};
    return {
      Program(program) {
        const bindings = importBindings(program);
        const cache = localNames(bindings, "cache", ["hono/cache"]);
        const handler = defineHandlerNames(bindings);
        if (cache.size === 0 || handler.size === 0) return;
        const users = new Set<string>();
        for (const name of USER_READS)
          for (const local of localNames(bindings, name, ["void/auth"])) users.add(local);
        for (const local of localNames(bindings, "getCookie", ["hono/cookie"])) users.add(local);
        const readsUser = (body: Parameters<typeof walk>[0]) => {
          let found = false;
          walk(body, (node) => {
            if (node.type !== "CallExpression") return;
            if (isCallTo(node, users)) found = true;
            const callee = node.callee;
            if (
              callee.type === "MemberExpression" &&
              !callee.computed &&
              callee.property.type === "Identifier" &&
              callee.property.name === "header" &&
              callee.object.type === "MemberExpression" &&
              callee.object.property.type === "Identifier" &&
              callee.object.property.name === "req" &&
              node.arguments[0] &&
              staticString(node.arguments[0])?.toLowerCase() === "cookie"
            )
              found = true;
          });
          return found;
        };
        walk(program, (node) => {
          if (!isCallTo(node, handler)) return;
          const cached = node.arguments.filter((arg) => {
            const value = unwrap(arg);
            return isCallTo(value, cache);
          });
          if (cached.length === 0) return;
          if (node.arguments.some((arg) => isFunction(arg) && arg.body && readsUser(arg.body)))
            for (const arg of cached) context.report({ node: arg, messageId: "userRoute" });
        });
      },
    };
  },
});
