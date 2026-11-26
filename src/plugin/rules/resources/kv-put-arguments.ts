import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass kv.put values as they are, and ttl and expiration in seconds.",
      norms: ["services/kv/3", "services/kv/4"],
      scope: "void",
    },
    messages: {
      stringified:
        "`kv.put` serialises values to JSON itself, so `JSON.stringify` here stores a string of JSON and reads back a string. Pass the value: `kv.put(key, value)`. See guide/kv.md.",
      expiration:
        "`expiration` is a Unix timestamp in seconds, and `Date.now()` is in milliseconds. Write `Math.floor(Date.now() / 1000) + 60`. See guide/kv.md.",
      ttl: "`ttl` is a number of seconds, and this value is in milliseconds. Write `ttl: 60`, not `60 * 1000`. See guide/kv.md.",
    },
    schema: [],
  },
  create(context) {
    let bindings: ReturnType<typeof importBindings> | null = null;
    const maps = new Set<string>();
    const text = (node: ESTree.Node) => context.sourceCode.getText(node);
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          bindings &&
          isCallOf(node.init, "kv", ["void/kv"], bindings) &&
          calleeName(unwrap(node.init)) === "kv.map"
        )
          maps.add(node.id.name);
      },
      CallExpression(node) {
        const callee = node.callee;
        if (!bindings || callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.property.type !== "Identifier" || callee.property.name !== "put") return;
        const target = unwrap(callee.object);
        const direct =
          target.type === "Identifier" &&
          bindings.get(target.name)?.source === "void/kv" &&
          bindings.get(target.name)?.imported === "kv";
        const mapped =
          target.type === "Identifier"
            ? maps.has(target.name)
            : isCallOf(target, "kv", ["void/kv"], bindings) && calleeName(target) === "kv.map";
        if (!direct && !mapped) return;
        const value = node.arguments[1] && unwrap(node.arguments[1]);
        if (value?.type === "CallExpression" && calleeName(value) === "JSON.stringify")
          context.report({ node: value, messageId: "stringified" });
        const options = node.arguments[2] && unwrap(node.arguments[2]);
        if (!options) return;
        const expiration = property(options, "expiration");
        if (expiration) {
          const source = text(expiration.value);
          if (
            /Date\.now\(\)/.test(source) &&
            !/\/\s*1000|Math\.(floor|round|trunc|ceil)/.test(source)
          )
            context.report({ node: expiration, messageId: "expiration" });
        }
        const ttl = property(options, "ttl");
        if (ttl) {
          const source = text(ttl.value);
          if (/Date\.now\(\)|\*\s*1000\b|\b1000\s*\*/.test(source))
            context.report({ node: ttl, messageId: "ttl" });
        }
      },
    };
  },
});
