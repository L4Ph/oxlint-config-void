import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * Files users upload can contain HTML or scripts. A response that streams a stored object
 * without `X-Content-Type-Options: nosniff` lets the browser run it as a page.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Set X-Content-Type-Options: nosniff on a response that serves a stored file.",
      norms: ["services/storage/2"],
      scope: "void",
    },
    messages: {
      nosniff:
        "This response serves the body of a stored object but this file never sets `X-Content-Type-Options`. Add `headers.set('X-Content-Type-Options', 'nosniff')` (and `Content-Disposition: attachment`) so an uploaded HTML or SVG file does not run as a page. See guide/storage.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.private || !(kind.convention === "routes" || kind.serverCompanion)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    const clients = new Set<string>();
    for (const [name, binding] of bindings)
      if (binding.imported === "storage" && binding.source === "void/storage") clients.add(name);
    if (clients.size === 0 && ![...bindings.values()].some((b) => b.imported === "createStorage"))
      return {};
    const objects = new Set<string>();
    const responses: Node[] = [];
    let headerSet = false;

    const isStorageClient = (node: Node) => {
      const value = unwrap(node);
      return value.type === "Identifier" && clients.has(value.name);
    };
    const bodyOf = (node: Node | undefined) => {
      const value = node && node.type !== "SpreadElement" ? unwrap(node) : null;
      return (
        value?.type === "MemberExpression" &&
        !value.computed &&
        value.property.type === "Identifier" &&
        value.property.name === "body" &&
        unwrap(value.object).type === "Identifier" &&
        objects.has((unwrap(value.object) as ESTree.IdentifierReference).name)
      );
    };
    return {
      VariableDeclarator(node) {
        if (!node.init) return;
        let init = unwrap(node.init);
        if (init.type === "AwaitExpression") init = unwrap(init.argument);
        if (node.id.type !== "Identifier" || init.type !== "CallExpression") return;
        const callee = init.callee;
        if (callee.type === "Identifier") {
          if (bindings.get(callee.name)?.imported === "createStorage") clients.add(node.id.name);
        } else if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          callee.property.name === "get" &&
          isStorageClient(callee.object)
        )
          objects.add(node.id.name);
      },
      NewExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "Response" &&
          bodyOf(node.arguments[0])
        )
          responses.push(node);
      },
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier" &&
          callee.property.name === "body" &&
          bodyOf(node.arguments[0])
        )
          responses.push(node);
      },
      Literal(node) {
        if (typeof node.value === "string" && node.value.toLowerCase() === "x-content-type-options")
          headerSet = true;
      },
      "Program:exit"() {
        if (headerSet) return;
        for (const node of responses) context.report({ node, messageId: "nosniff" });
      },
    };
  },
});
