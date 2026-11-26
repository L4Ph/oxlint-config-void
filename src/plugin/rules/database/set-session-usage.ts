import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { callsVoid, isDbIdentifier } from "../../lib/database.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Scope = {
  dbAccess: ESTree.Node[];
  sets: ESTree.CallExpression[];
  bookmarks: ESTree.CallExpression[];
  /** Start of the function body's own top-level `await next()`, when it has one. */
  next: number | null;
};

const SESSION_NAMES = new Set(["first-primary", "first-unconstrained"]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call setSession() from middleware, before the first use of db and before next(), with a valid argument.",
      norms: [
        "reference/database/8",
        "reference/database/9",
        "services/d1/16",
        "reference/database/10",
      ],
      scope: "void",
    },
    messages: {
      placement:
        "`setSession()` sets the default `db` session for the request, and it belongs in a file of `middleware/`. Move the call there, or create an explicit client with `createDb(binding, { session })` here. See reference/api/database.md.",
      afterDb:
        "`db` is read before this `setSession()`, so the session has already opened and cannot be changed. Call `setSession()` first in the middleware. See reference/api/database.md.",
      afterNext:
        "This `setSession()` runs after `await next()`, when the handlers have already used `db`. Call it before `next()`. See guide/database/d1.md.",
      bookmarkBeforeNext:
        "`getBookmark()` runs before `await next()`, so it misses the queries of the handlers. Read it after `next()`. See guide/database/d1.md.",
      badName:
        "`{{name}}` is not a session start. Pass `'first-primary'`, `'first-unconstrained'` or `{ bookmark }`. See reference/api/database.md.",
      unwrapped:
        "A bookmark string must be wrapped: pass `{ bookmark: ... }`, not the bare value. When there is no incoming bookmark, pass `'first-unconstrained'`. See reference/api/database.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    const file = locate(context);
    const kind = file ? describe(file) : null;
    const inMiddleware = file?.dir === "middleware" && !kind?.private;
    // shortcut: only files of the other convention directories are told to move; a helper elsewhere may run from middleware
    const wrongPlace =
      kind !== null &&
      kind.convention !== null &&
      kind.convention !== "middleware" &&
      kind.convention !== "db" &&
      !kind.private;
    const stack: Scope[] = [];
    const open = (node: ESTree.Function | ESTree.ArrowFunctionExpression) => {
      let next: number | null = null;
      if (node.body?.type === "BlockStatement") {
        for (const statement of node.body.body) {
          if (statement.type !== "ExpressionStatement") continue;
          const expression = unwrap(
            statement.expression.type === "AwaitExpression"
              ? statement.expression.argument
              : statement.expression,
          );
          if (
            expression.type === "CallExpression" &&
            expression.callee.type === "Identifier" &&
            expression.callee.name === "next"
          ) {
            next = statement.start;
            break;
          }
        }
      }
      stack.push({ dbAccess: [], sets: [], bookmarks: [], next });
    };
    const close = () => {
      const scope = stack.pop();
      if (!scope || !inMiddleware) return;
      for (const call of scope.sets) {
        if (scope.dbAccess.some((access) => access.start < call.start))
          context.report({ node: call, messageId: "afterDb" });
        else if (scope.next !== null && scope.next < call.start)
          context.report({ node: call, messageId: "afterNext" });
      }
      if (scope.next !== null)
        for (const call of scope.bookmarks)
          if (call.start < scope.next)
            context.report({ node: call, messageId: "bookmarkBeforeNext" });
    };
    return {
      FunctionDeclaration: open,
      "FunctionDeclaration:exit": close,
      FunctionExpression: open,
      "FunctionExpression:exit": close,
      ArrowFunctionExpression: open,
      "ArrowFunctionExpression:exit": close,
      MemberExpression(node) {
        if (isDbIdentifier(node.object, bindings)) stack.at(-1)?.dbAccess.push(node);
      },
      CallExpression(node) {
        if (callsVoid(node, "getBookmark", ["void/db"], bindings)) {
          if (node.arguments.length === 0) stack.at(-1)?.bookmarks.push(node);
          return;
        }
        if (!callsVoid(node, "setSession", ["void/db"], bindings)) return;
        stack.at(-1)?.sets.push(node);
        if (wrongPlace) context.report({ node, messageId: "placement" });
        const arg = node.arguments[0];
        if (!arg) return;
        const value = unwrap(arg);
        const text = staticString(value);
        if (text !== null && !SESSION_NAMES.has(text))
          context.report({ node: arg, messageId: "badName", data: { name: JSON.stringify(text) } });
        else if (value.type === "CallExpression") {
          const callee = value.callee;
          const bare =
            callsVoid(value, "getBookmark", ["void/db"], bindings) ||
            (callee.type === "MemberExpression" &&
              !callee.computed &&
              callee.property.type === "Identifier" &&
              callee.property.name === "header") ||
            (callee.type === "Identifier" && callee.name === "getCookie");
          if (bare) context.report({ node: arg, messageId: "unwrapped" });
        }
      },
    };
  },
});
