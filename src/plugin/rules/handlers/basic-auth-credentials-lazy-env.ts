import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { isFunction, localNames, walk } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

const CREDENTIALS = new Set(["username", "password"]);
const OPTIONS = new Set(["username", "password", "realm", "message"]);

/**
 * reference/api/handlers.md:101-105: credentials come "from `void/env`", and "wrap the reads
 * in functions so they are resolved per request". A literal `realm` is the docs' own example,
 * so only `username` and `password` are checked for literals.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give basicAuth its credentials as functions that read void/env, not as literals or eager env reads.",
      norms: ["reference/handlers/7", "reference/handlers/9", "guide-core/server-routing/20"],
      scope: "void",
    },
    messages: {
      literal:
        "`{{key}}` is a string written in the source. Read credentials from `void/env` through a function: `{{key}}: () => env.BASIC_AUTH_{{upper}}`. See reference/api/handlers.md.",
      eager:
        "`{{key}}` reads `env` when this module loads, before Void has bound the runtime env. Wrap the read in a function: `{{key}}: () => env.NAME`. See reference/api/handlers.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const bindings = importBindings(program);
        const basicAuth = localNames(bindings, "basicAuth", ["void", "void/handler"]);
        const env = localNames(bindings, "env", ["void/env"]);
        if (basicAuth.size === 0) return;
        walk(program, (node) => {
          if (
            node.type !== "CallExpression" ||
            node.callee.type !== "Identifier" ||
            !basicAuth.has(node.callee.name)
          )
            return;
          const options = node.arguments[0];
          if (options?.type !== "ObjectExpression") return;
          for (const member of options.properties) {
            if (member.type !== "Property" || member.computed) continue;
            const key =
              member.key.type === "Identifier"
                ? member.key.name
                : member.key.type === "Literal"
                  ? String(member.key.value)
                  : "";
            if (!OPTIONS.has(key)) continue;
            const value = unwrap(member.value);
            if (isFunction(value)) continue;
            if (CREDENTIALS.has(key) && staticString(value) !== null) {
              context.report({
                node: member.value,
                messageId: "literal",
                data: { key, upper: key.toUpperCase() },
              });
              continue;
            }
            let reads = false;
            walk(value, (inner) => {
              if (isFunction(inner)) return false;
              if (
                inner.type === "MemberExpression" &&
                inner.object.type === "Identifier" &&
                env.has(inner.object.name)
              )
                reads = true;
            });
            if (reads) context.report({ node: member.value, messageId: "eager", data: { key } });
          }
        });
      },
    };
  },
});
