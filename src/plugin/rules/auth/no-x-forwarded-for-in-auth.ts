import { isAuthFile } from "../../lib/auth.ts";
import { walk } from "../../lib/handlers.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/auth.md:208: "Don't read the client IP from `x-forwarded-for` instead: any client can
 * send that header. Give the trusted caller a secret header".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not read x-forwarded-for in auth.ts; check a secret header to skip rate limits.",
      norms: ["guide-core/auth/25"],
      scope: "void",
    },
    messages: {
      header:
        "Any client can send `x-forwarded-for`, so it cannot identify a trusted caller or a client IP. Give the trusted caller a secret header and compare it with a secret from `env`. See guide/auth.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isAuthFile(locate(context))) return {};
    return {
      Program(program) {
        walk(program, (node, parent) => {
          if (
            node.type !== "Literal" ||
            typeof node.value !== "string" ||
            node.value.toLowerCase() !== "x-forwarded-for" ||
            parent === null
          )
            return;
          const argumentOfRead =
            parent.type === "CallExpression" &&
            parent.arguments[0] === node &&
            parent.callee.type === "MemberExpression" &&
            !parent.callee.computed &&
            parent.callee.property.type === "Identifier" &&
            (parent.callee.property.name === "get" || parent.callee.property.name === "header");
          const key = parent.type === "Property" && parent.key === node && !parent.computed;
          const indexed =
            parent.type === "MemberExpression" && parent.computed && parent.property === node;
          if (argumentOfRead || key || indexed) context.report({ node, messageId: "header" });
        });
      },
    };
  },
});
