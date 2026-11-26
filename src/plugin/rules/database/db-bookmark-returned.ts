import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings } from "../../lib/ast.ts";
import { callsVoid, sessionValues } from "../../lib/database.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Return getBookmark(client) for a createDb client that starts from an incoming bookmark.",
      norms: ["services/d1/29"],
      scope: "void",
    },
    messages: {
      missing:
        "This client starts from an incoming bookmark, but the file never calls `getBookmark(client)`, so the caller cannot see its own writes later. After the queries, return `getBookmark(client)` in the response header. See guide/database/d1.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    const clients: { call: ESTree.CallExpression; name: string | null }[] = [];
    const bookmarked = new Set<string | null>();
    return {
      VariableDeclarator(node) {
        const init = node.init;
        if (init?.type !== "CallExpression" || node.id.type !== "Identifier") return;
        if (!callsVoid(init, "createDb", ["void/db"], bindings) || !hasBookmark(init)) return;
        clients.push({ call: init, name: node.id.name });
      },
      CallExpression(node) {
        if (callsVoid(node, "createDb", ["void/db"], bindings) && hasBookmark(node)) {
          if (!clients.some((c) => c.call === node)) clients.push({ call: node, name: null });
        }
        if (callsVoid(node, "getBookmark", ["void/db"], bindings)) {
          const arg = node.arguments[0];
          bookmarked.add(arg?.type === "Identifier" ? arg.name : arg ? "?" : null);
        }
      },
      "Program:exit"() {
        // shortcut: a getBookmark(<non-identifier>) argument counts for every client
        for (const { call, name } of clients) {
          const returned =
            bookmarked.has("?") || (name === null ? bookmarked.size > 0 : bookmarked.has(name));
          if (!returned) context.report({ node: call, messageId: "missing" });
        }
      },
    };
  },
});

function hasBookmark(call: ESTree.CallExpression): boolean {
  return sessionValues(call.arguments[1]).some(
    (value) =>
      value.type === "ObjectExpression" &&
      value.properties.some(
        (p) =>
          p.type === "Property" &&
          !p.computed &&
          ((p.key.type === "Identifier" && p.key.name === "bookmark") ||
            (p.key.type === "Literal" && p.key.value === "bookmark")),
      ),
  );
}
