import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import { isCallTo, localNames, walk } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const LOGIN = /login|sign-?in/i;

/**
 * integrations/hono.md:128: "For a sign-in check like this one, `requireAuth(c, { throwRedirect:
 * '/login' })` provides the same guard and selects the redirect status for you." The docs'
 * own hand-written guard (integrations/hono.md:113-123) sits in `lib/`, outside the files
 * this rule governs.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Guard a page or route with requireAuth(c, { throwRedirect }) instead of throwing the login redirect by hand.",
      norms: ["edge-integrations/hono/11"],
      scope: "void",
    },
    messages: {
      guard:
        "`requireAuth(c, { throwRedirect: '/login' })` is this same guard, and it picks the redirect status for you. Use it instead of checking the user and throwing the redirect. See integrations/hono.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    const governed =
      !kind.test &&
      (kind.serverCompanion || kind.convention === "routes" || kind.convention === "middleware");
    if (!governed) return {};
    return {
      Program(program) {
        const bindings = importBindings(program);
        const users = new Set([
          ...localNames(bindings, "getUser", ["void/auth"]),
          ...localNames(bindings, "getSession", ["void/auth"]),
        ]);
        const exceptions = localNames(bindings, "HTTPException", ["hono/http-exception", "hono"]);
        if (users.size === 0 || exceptions.size === 0) return;
        const userVars = new Set<string>();
        walk(program, (node) => {
          if (node.type !== "VariableDeclarator" || node.id.type !== "Identifier" || !node.init)
            return;
          const init = unwrap(
            node.init.type === "AwaitExpression" ? node.init.argument : node.init,
          );
          if (isCallTo(init, users)) userVars.add(node.id.name);
        });
        const isLoginRedirect = (node: Parameters<typeof unwrap>[0]) => {
          const value = unwrap(node);
          if (
            value.type !== "NewExpression" ||
            value.callee.type !== "Identifier" ||
            !exceptions.has(value.callee.name)
          )
            return false;
          const [status, options] = value.arguments;
          if (status?.type !== "Literal" || (status.value !== 302 && status.value !== 303))
            return false;
          const res = options ? property(options, "res") : null;
          const call = res ? unwrap(res.value) : null;
          if (
            call?.type !== "CallExpression" ||
            call.callee.type !== "MemberExpression" ||
            call.callee.computed ||
            call.callee.property.type !== "Identifier" ||
            call.callee.property.name !== "redirect"
          )
            return false;
          const target = call.arguments[0] ? staticString(call.arguments[0]) : null;
          return target !== null && LOGIN.test(target);
        };
        walk(program, (node) => {
          if (node.type !== "IfStatement") return;
          const test = unwrap(node.test);
          if (test.type !== "UnaryExpression" || test.operator !== "!") return;
          const subject = unwrap(test.argument);
          const readsUser =
            isCallTo(subject, users) ||
            (subject.type === "Identifier" && userVars.has(subject.name));
          if (!readsUser) return;
          const body =
            node.consequent.type === "BlockStatement" ? node.consequent.body : [node.consequent];
          const only = body.length === 1 ? body[0] : undefined;
          if (only?.type === "ThrowStatement" && isLoginRedirect(only.argument))
            context.report({ node, messageId: "guard" });
        });
      },
    };
  },
});
