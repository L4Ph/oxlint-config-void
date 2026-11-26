import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { ancestors, isFunction } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

const BRANCHES = new Set([
  "IfStatement",
  "ConditionalExpression",
  "SwitchCase",
  "LogicalExpression",
]);

/** The statement list a call runs in; null when it sits in a branch (the other branch may run instead). */
function straightLine(node: ESTree.Node): { fn: ESTree.Node; block: ESTree.Node } | null {
  let block: ESTree.Node | null = null;
  for (const parent of ancestors(node)) {
    if (isFunction(parent) || (parent.type as string) === "Program")
      return { fn: parent, block: block ?? parent };
    if (BRANCHES.has(parent.type) || parent.type === "TryStatement") return null;
    if (!block && (parent.type === "BlockStatement" || (parent.type as string) === "Program"))
      block = parent;
  }
  return null;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call parseEmail once per message, use replyEmail only in email/, and give forward/reply bare addresses.",
      norms: ["services/receiving/11", "services/receiving/5", "services/receiving/6"],
      scope: "void",
    },
    messages: {
      replyOutside:
        "`replyEmail()` works on the incoming message of an `email/` handler, and this file is not in `email/`. To reply after the handler returns, use `sendEmail({ ..., threading })`. See guide/email/receiving.md.",
      displayName:
        "`{{value}}` has a display name. `forward` and `message.reply` take bare addresses: write `ops@example.com`. See guide/email/receiving.md.",
      parsedTwice:
        "`parseEmail({{name}})` was already called for this message, and the message stream can be read only once. Keep the first result and reuse it. See guide/email/receiving.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const inEmail = file.dir === "email";
    let bindings: ReturnType<typeof importBindings> | null = null;
    const seen = new Set<string>();
    const ids = new Map<ESTree.Node, number>();
    const idOf = (node: ESTree.Node) => {
      if (!ids.has(node)) ids.set(node, ids.size);
      return ids.get(node);
    };
    const bare = (node: ESTree.Node | undefined) => {
      const value = node && staticString(node);
      return value?.includes("<") && value.includes(">") ? value : null;
    };
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        if (!bindings) return;
        const callee = node.callee;
        if (callee.type === "Identifier") {
          const binding = bindings.get(callee.name);
          if (binding?.source !== "void/email") return;
          if (binding.imported === "replyEmail" && !inEmail)
            context.report({ node, messageId: "replyOutside" });
          const arg = node.arguments[0];
          if (binding.imported === "parseEmail" && inEmail && arg?.type === "Identifier") {
            const where = straightLine(node);
            if (!where) return;
            const key = `${idOf(where.fn)}:${idOf(where.block)}:${arg.name}`;
            if (seen.has(key))
              context.report({ node, messageId: "parsedTwice", data: { name: arg.name } });
            seen.add(key);
          }
          return;
        }
        if (!inEmail || callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.property.type !== "Identifier") return;
        if (callee.property.name === "forward") {
          const literal = bare(node.arguments[0]);
          if (literal)
            context.report({
              node: node.arguments[0]!,
              messageId: "displayName",
              data: { value: literal },
            });
        } else if (callee.property.name === "reply" && node.arguments[0]) {
          const options = unwrap(node.arguments[0]);
          for (const key of ["to", "from"]) {
            const entry = property(options, key);
            const literal = entry && bare(entry.value);
            if (literal)
              context.report({
                node: entry.value,
                messageId: "displayName",
                data: { value: literal },
              });
          }
        }
      },
    };
  },
});
