import { importBindings, staticString } from "../../lib/ast.ts";
import { callsVoid, sessionValues } from "../../lib/database.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Run setSession(), the no-argument getBookmark() and a primary-first createDb() inside the request, never at module scope.",
      norms: ["reference/database/5", "reference/database/15", "services/d1/11"],
      scope: "void",
    },
    messages: {
      setSession:
        "`setSession()` needs Void's request scope, and this call runs when the module loads. Call it inside a middleware function. See reference/api/database.md.",
      getBookmark:
        "`getBookmark()` with no argument needs Void's request scope, and this call runs when the module loads. Call it inside a request, or pass the client from `createDb()`. See reference/api/database.md.",
      createDb:
        "A `'first-primary'` client created at module scope is shared by every request, so only the first read is primary-first. Create it inside the handler. See guide/database/d1.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    let depth = 0;
    const enter = () => void depth++;
    const leave = () => void depth--;
    return {
      FunctionDeclaration: enter,
      "FunctionDeclaration:exit": leave,
      FunctionExpression: enter,
      "FunctionExpression:exit": leave,
      ArrowFunctionExpression: enter,
      "ArrowFunctionExpression:exit": leave,
      // a class member may run per request; stay silent inside classes
      ClassBody: enter,
      "ClassBody:exit": leave,
      CallExpression(node) {
        if (depth > 0) return;
        if (callsVoid(node, "setSession", ["void/db"], bindings))
          context.report({ node, messageId: "setSession" });
        else if (callsVoid(node, "getBookmark", ["void/db"], bindings)) {
          if (node.arguments.length === 0) context.report({ node, messageId: "getBookmark" });
        } else if (
          callsVoid(node, "createDb", ["void/db"], bindings) &&
          sessionValues(node.arguments[1]).some((v) => staticString(v) === "first-primary")
        )
          context.report({ node, messageId: "createDb" });
      },
    };
  },
});
