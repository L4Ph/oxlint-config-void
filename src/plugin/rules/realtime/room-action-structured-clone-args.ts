import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, unwrap } from "../../lib/ast.ts";
import { constInit } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

/** Built-ins the structured clone algorithm copies, so `new X()` of them is a fine argument. */
const CLONEABLE = new Set([
  "Array",
  "Object",
  "Date",
  "Map",
  "Set",
  "RegExp",
  "Boolean",
  "Number",
  "String",
  "BigInt",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
  "ArrayBuffer",
  "SharedArrayBuffer",
  "DataView",
  "Blob",
  "File",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",
]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Pass structured-clone data, not functions or class instances, to room actions.",
      norms: ["services/websockets/19"],
      scope: "void",
    },
    messages: {
      argument:
        "Room action arguments cross a Durable Object boundary, and {{what}} cannot be cloned. Pass plain data (strings, numbers, objects, arrays). See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    /** True when `node` is `getRoom(...)`, or a `const` of this file holding one. */
    const isRoom = (node: ESTree.Node, depth = 0): boolean => {
      const value = unwrap(node);
      if (value.type === "AwaitExpression") return isRoom(value.argument, depth);
      if (value.type === "CallExpression")
        return isCallOf(value, "getRoom", ["void/ws/server"], bindings);
      if (value.type !== "Identifier" || depth > 0) return false;
      const init = constInit(context, value);
      return init !== null && isRoom(init, depth + 1);
    };
    return {
      CallExpression(node) {
        const callee = node.callee;
        // <room>.actions.<name>(...)
        if (callee.type !== "MemberExpression" || callee.object.type !== "MemberExpression") return;
        const actions = callee.object;
        if (
          actions.computed ||
          actions.property.type !== "Identifier" ||
          actions.property.name !== "actions"
        )
          return;
        if (!isRoom(actions.object)) return;
        for (const argument of node.arguments) {
          if (argument.type === "SpreadElement") continue;
          const value = unwrap(argument);
          const what =
            value.type === "ArrowFunctionExpression" || value.type === "FunctionExpression"
              ? "a function"
              : value.type === "NewExpression" &&
                  value.callee.type === "Identifier" &&
                  !CLONEABLE.has(value.callee.name)
                ? `a \`${value.callee.name}\` instance`
                : null;
          if (what) context.report({ node: argument, messageId: "argument", data: { what } });
        }
      },
    };
  },
});
