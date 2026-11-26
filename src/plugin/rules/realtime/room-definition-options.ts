import type { ESTree } from "vite-plus/lint/plugins";
import {
  importBindings,
  isCallOf,
  property,
  staticString,
  topLevelConst,
  unwrap,
} from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import {
  type Fn,
  fnOf,
  hasSpread,
  isWsRoute,
  optionsOf,
  returned,
  walkOwn,
} from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const WORDS = /^[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*$/;
const RANDOM = new Set(["Math.random", "Date.now", "crypto.randomUUID"]);

/** Why a `key` function does not return a stable string synchronously, or null when it might. */
function keyProblem(fn: Fn, text: (node: ESTree.Node) => string): string | null {
  if (fn.async) return "is async";
  let awaits = false;
  walkOwn(fn, (node) => {
    if (node.type === "AwaitExpression") awaits = true;
  });
  if (awaits) return "awaits";
  for (const value of returned(fn)) {
    const result = unwrap(value);
    if (result.type === "Literal" && typeof result.value !== "string")
      return `returns ${text(result)}`;
    if (result.type === "CallExpression" && RANDOM.has(text(result.callee)))
      return `returns ${text(result)}`;
  }
  return null;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give rooms and sockets `messages.client` and `messages.server`, a synchronous `key` and a static `name`.",
      norms: [
        "reference/durable/5",
        "services/websockets/8",
        "reference/durable/7",
        "services/websockets/31",
        "services/websockets/28",
        "services/durable-state/14",
      ],
      scope: "void",
    },
    messages: {
      messages:
        "`{{call}}` needs `messages: { client, server }`, the Standard Schema validators for what the browser sends and what the server sends. {{detail}} See guide/websockets.md.",
      key: "`key` {{why}}, but it must return a stable string synchronously and the same string for the same params. Return a string built from `params`. See reference/api/durable.md.",
      name: "`name` must be a static string, inline or in a local `const`, because Void reads it at build time to fix the resource's identity. See {{page}}.",
      words:
        "`name: '{{name}}'` should be words that start with a letter, joined by `-` (for example `'shopping-cart'`). See guide/durable-state.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    const ws = isWsRoute(file);
    if (!ws && file?.dir !== "durable-objects") return {};
    const program = context.sourceCode.ast;
    const bindings = importBindings(program);
    const text = (node: ESTree.Node) => context.sourceCode.getText(node);

    /** `name` is a static string, an identifier bound to one in this file, or something Void cannot read. */
    const checkName = (value: ESTree.Node, page: string, words: boolean) => {
      const node = unwrap(value);
      let spelled = staticString(node);
      if (node.type === "Identifier") {
        const bound = topLevelConst(program, node.name);
        if (bound === null) return; // imported or not a top-level const: unknown
        spelled = staticString(bound);
        if (spelled === null) {
          context.report({ node, messageId: "name", data: { page } });
          return;
        }
      } else if (spelled === null) {
        const certain = [
          "TemplateLiteral",
          "BinaryExpression",
          "CallExpression",
          "ConditionalExpression",
          "MemberExpression",
          "Literal",
        ];
        if (certain.includes(node.type))
          context.report({ node, messageId: "name", data: { page } });
        return;
      }
      if (words && !WORDS.test(spelled))
        context.report({ node, messageId: "words", data: { name: spelled } });
    };

    return {
      CallExpression(node) {
        const room = isCallOf(node, "defineRoom", ["void/ws"], bindings);
        const socket = isCallOf(node, "defineWebSocket", ["void/ws"], bindings);
        const state = isCallOf(node, "defineDurableState", ["void/durable"], bindings);
        if ((room || socket) && !ws) return;
        if (state && ws) return;
        if (!room && !socket && !state) return;
        const options = optionsOf(node);
        if (!options && node.arguments.length > 0) return; // computed options
        if (options && hasSpread(options)) return;
        const name = room ? "defineRoom" : socket ? "defineWebSocket" : "defineDurableState";
        if (room || socket) {
          const messages = options ? property(options, "messages") : null;
          let value = messages ? unwrap(messages.value) : null;
          if (value?.type === "Identifier")
            value = unwrap(topLevelConst(program, value.name) ?? value);
          const object = value?.type === "ObjectExpression" ? value : null;
          if (!messages) {
            context.report({
              node,
              messageId: "messages",
              data: { call: name, detail: "This call has no `messages` option." },
            });
          } else if (object && !hasSpread(object)) {
            const missing = ["client", "server"].filter((side) => !property(object, side));
            if (missing.length > 0)
              context.report({
                node: messages,
                messageId: "messages",
                data: { call: name, detail: `\`messages\` has no \`${missing.join("` or `")}\`.` },
              });
          }
          const key = options && property(options, "key");
          const fn = key ? fnOf(key.value) : null;
          const why = fn ? keyProblem(fn, text) : null;
          if (key && why) context.report({ node: key, messageId: "key", data: { why } });
        }
        const given = options && property(options, "name");
        if (given)
          checkName(given.value, state ? "guide/durable-state.md" : "guide/websockets.md", state);
      },
    };
  },
});
