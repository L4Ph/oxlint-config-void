import { importBindings, unwrap } from "../../lib/ast.ts";
import { callsImported } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

/**
 * `defaults` already holds Void's own auth configuration and the result is not deep-merged,
 * so the object the `defineAuth` callback returns has to spread it. A returned object with
 * a spread of any kind is left alone, since the spread may carry `defaults`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Spread `defaults` into the object a defineAuth callback returns.",
      norms: ["reference/auth/3", "guide-core/auth/30"],
      scope: "void",
    },
    messages: {
      spread:
        "This object is returned from `defineAuth` without `...defaults`, so Void's own auth configuration is dropped (it is not merged for you). Take `defaults` from the callback's parameter and write `({ defaults }) => ({ ...defaults, /* your options */ })`. See reference/api/auth.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!callsImported(node, "defineAuth", ["void/auth"], bindings)) return;
        const callback = node.arguments[0] && unwrap(node.arguments[0]);
        if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression")
          return;
        const body = callback.body;
        if (!body) return;
        const returned =
          body.type === "BlockStatement"
            ? body.body.flatMap((statement) =>
                statement.type === "ReturnStatement" && statement.argument
                  ? [statement.argument]
                  : [],
              )
            : [body];
        for (const value of returned) {
          const object = unwrap(value);
          if (
            object.type === "ObjectExpression" &&
            !object.properties.some((member) => member.type === "SpreadElement")
          )
            context.report({ node: object, messageId: "spread" });
        }
      },
    };
  },
});
