import { importBindings } from "../../lib/ast.ts";
import { localNames, walk } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/pages-routing/errors.md:109: "Use a 4xx or 5xx status"; integrations/hono.md:109: a
 * redirect is an `HTTPException` with the redirect response in `res`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give HTTPException a 4xx or 5xx status, or a 3xx status with the redirect response in res.",
      norms: ["pages-routing/errors/7", "edge-integrations/hono/9"],
      scope: "void",
    },
    messages: {
      status:
        "`HTTPException` is for errors: use a 4xx or 5xx status here, not {{status}}. To redirect, throw `new HTTPException(302, { res: c.redirect('/login') })`. See guide/pages-routing/errors.md.",
      redirectWithoutRes:
        "A `HTTPException` with a {{status}} status needs the redirect response in `res`: `new HTTPException({{status}}, { res: c.redirect('/login') })`. Without it nothing carries the Location. See integrations/hono.md.",
      throwRedirect:
        "Throw an `HTTPException` that carries the redirect, not the response itself: `throw new HTTPException(302, { res: c.redirect(url) })`. See integrations/hono.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const names = localNames(importBindings(program), "HTTPException", [
          "hono/http-exception",
          "hono",
        ]);
        walk(program, (node) => {
          if (node.type === "ThrowStatement") {
            const arg = node.argument;
            if (
              arg.type === "CallExpression" &&
              arg.callee.type === "MemberExpression" &&
              !arg.callee.computed &&
              arg.callee.property.type === "Identifier" &&
              arg.callee.property.name === "redirect" &&
              arg.callee.object.type === "Identifier" &&
              ["c", "ctx", "context"].includes(arg.callee.object.name)
            )
              context.report({ node, messageId: "throwRedirect" });
            return;
          }
          if (
            node.type !== "NewExpression" ||
            node.callee.type !== "Identifier" ||
            !names.has(node.callee.name)
          )
            return;
          const first = node.arguments[0];
          if (first?.type !== "Literal" || typeof first.value !== "number") return;
          const status = first.value;
          if (status >= 400 && status <= 599) return;
          if (status < 300 || status > 399) {
            context.report({ node: first, messageId: "status", data: { status: String(status) } });
            return;
          }
          const options = node.arguments[1];
          if (options === undefined) {
            context.report({
              node,
              messageId: "redirectWithoutRes",
              data: { status: String(status) },
            });
            return;
          }
          if (options.type !== "ObjectExpression") return;
          const known = options.properties.every((member) => member.type === "Property");
          const hasRes = options.properties.some(
            (member) =>
              member.type === "Property" &&
              !member.computed &&
              ((member.key.type === "Identifier" && member.key.name === "res") ||
                (member.key.type === "Literal" && member.key.value === "res")),
          );
          if (known && !hasRes)
            context.report({
              node,
              messageId: "redirectWithoutRes",
              data: { status: String(status) },
            });
        });
      },
    };
  },
});
