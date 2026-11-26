import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, staticString } from "../../lib/ast.ts";
import { callsVoid } from "../../lib/database.ts";
import { isTestPath } from "../../lib/testing.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Assert on outgoing mail with createEmailTestHarness, never by mocking void/email, and dispose the harness.",
      norms: ["services/sending/31", "services/sending/32"],
      scope: "void",
    },
    messages: {
      mock: "`void/email` is mocked here. Use `createEmailTestHarness()` from `void/email/testing` to capture sends instead, and assert on `inbox.messages`. See guide/email/sending.md.",
      dispose:
        "`{{name}}` intercepts every `sendEmail` call until it is disposed, and this file never calls `{{name}}.dispose()`. Call it at the end of the test or in `afterEach`. See guide/email/sending.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isTestPath(context.filename)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    const harnesses: { node: ESTree.VariableDeclarator; name: string }[] = [];
    const disposed = new Set<string>();
    return {
      CallExpression(node) {
        const name = calleeName(node);
        if ((name === "vi.mock" || name === "vi.doMock") && node.arguments[0]) {
          if (staticString(node.arguments[0] as never) === "void/email")
            context.report({ node, messageId: "mock" });
        } else if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "dispose" &&
          node.callee.object.type === "Identifier"
        )
          disposed.add(node.callee.object.name);
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          callsVoid(
            unwrapAwait(node.init),
            "createEmailTestHarness",
            ["void/email/testing"],
            bindings,
          )
        )
          harnesses.push({ node, name: node.id.name });
      },
      "Program:exit"() {
        for (const { node, name } of harnesses)
          if (!disposed.has(name)) context.report({ node, messageId: "dispose", data: { name } });
      },
    };
  },
});

function unwrapAwait(node: ESTree.Node): ESTree.Node {
  return node.type === "AwaitExpression" ? node.argument : node;
}
