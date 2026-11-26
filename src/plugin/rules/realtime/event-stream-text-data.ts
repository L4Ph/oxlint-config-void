import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, unwrap } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { constInit } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const BINARY = new Set([
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

/** What the syntax shows `data` to be: binary, or a function. Null when it does not show. */
function kind(
  context: { sourceCode: { getScope(n: ESTree.Node): any } },
  node: ESTree.Node,
  depth = 0,
): string | null {
  const value = unwrap(node);
  switch (value.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return "a function";
    case "NewExpression":
      return value.callee.type === "Identifier" && BINARY.has(value.callee.name)
        ? `a \`${value.callee.name}\``
        : null;
    case "AwaitExpression":
      return kind(context, value.argument, depth);
    case "CallExpression": {
      const callee = value.callee;
      const method =
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.property.type === "Identifier"
          ? callee.property.name
          : null;
      return method === "arrayBuffer" || method === "bytes" ? "binary data" : null;
    }
    case "Identifier": {
      // follow one `const` of this file
      if (depth > 0) return null;
      const init = constInit(context, value);
      return init ? kind(context, init, depth + 1) : null;
    }
    default:
      return null;
  }
}

/**
 * Narrower than the plan, which asks for the type of `data`: the linter gives a JS plugin
 * no type information (`parserServices` is empty), so this reads what the syntax shows,
 * in a file that imports `eventStream` from `void/sse`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Send SSE `data` as a string or JSON-serialisable value, never binary.",
      norms: ["services/sse/4"],
      scope: "void",
    },
    messages: {
      binary:
        "SSE is text-only and `data` is {{kind}}. Send a string or a JSON-serialisable value; encode binary as text (for example base64) first. See guide/sse.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "routes") return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (
      ![...bindings.values()].some((b) => b.source === "void/sse" && b.imported === "eventStream")
    )
      return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "send"
        )
          return;
        const first = node.arguments[0];
        const message = first && first.type !== "SpreadElement" ? unwrap(first) : null;
        const data = message && property(message, "data");
        const what = data ? kind(context, data.value) : null;
        if (data && what) context.report({ node: data, messageId: "binary", data: { kind: what } });
      },
    };
  },
});
