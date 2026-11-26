import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

// ArrayBuffer has none of these; on a string they are the usual way to read output.
const STRING_METHODS = new Set([
  "trim",
  "trimEnd",
  "trimStart",
  "split",
  "includes",
  "startsWith",
  "endsWith",
  "replace",
  "replaceAll",
  "match",
  "toString",
  "toUpperCase",
  "toLowerCase",
]);

/** Calls `visit(node, parent)` for every node of the tree. */
function walk(
  node: unknown,
  visit: (n: Node, parent: Node | null) => void,
  parent: Node | null = null,
): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit, parent);
    return;
  }
  if (node === null || typeof node !== "object" || typeof (node as Node).type !== "string") return;
  visit(node as Node, parent);
  for (const [key, value] of Object.entries(node))
    if (key !== "parent") walk(value, visit, node as Node);
}

/**
 * `run()` resolves with `stdout` and `stderr` as `ArrayBuffer`s. Used as a string they become
 * `[object ArrayBuffer]`. The rule follows the result of `await <sandbox>.run(...)` through
 * the file's syntax; it has no types, so a result that is passed on or typed elsewhere is not seen.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Decode the stdout and stderr of sandbox run() before using them as strings.",
      norms: ["services/sandboxes/4"],
      scope: "void",
    },
    messages: {
      buffer:
        "`{{name}}` of `run()` is an ArrayBuffer, not a string. Decode it first: `new TextDecoder().decode({{name}})`. See guide/sandboxes.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    const imported = (name: string) => {
      const binding = bindings.get(name);
      return binding?.imported === "getSandbox" && binding.source === "void/sandbox";
    };
    if (![...bindings.keys()].some(imported)) return {};
    return {
      "Program:exit"(program) {
        const sandboxes = new Set<string>();
        const isGetSandbox = (n: Node) =>
          n.type === "CallExpression" && n.callee.type === "Identifier" && imported(n.callee.name);
        const isSandbox = (n: Node) => {
          let value = unwrap(n);
          if (value.type === "AwaitExpression") value = unwrap(value.argument);
          return value.type === "Identifier" ? sandboxes.has(value.name) : isGetSandbox(value);
        };
        // `await <sandbox>.run(...)`
        const isRunResult = (n: Node) => {
          const value = unwrap(n);
          if (value.type !== "AwaitExpression") return false;
          const call = unwrap(value.argument);
          return (
            call.type === "CallExpression" &&
            call.callee.type === "MemberExpression" &&
            !call.callee.computed &&
            call.callee.property.type === "Identifier" &&
            call.callee.property.name === "run" &&
            isSandbox(call.callee.object)
          );
        };
        const results = new Set<string>();
        const buffers = new Set<string>();
        walk(program, (n) => {
          if (n.type !== "VariableDeclarator" || !n.init) return;
          if (n.id.type === "Identifier" && isSandbox(n.init)) sandboxes.add(n.id.name);
          else if (isRunResult(n.init)) {
            if (n.id.type === "Identifier") results.add(n.id.name);
            else if (n.id.type === "ObjectPattern")
              for (const p of n.id.properties)
                if (
                  p.type === "Property" &&
                  p.key.type === "Identifier" &&
                  (p.key.name === "stdout" || p.key.name === "stderr") &&
                  p.value.type === "Identifier"
                )
                  buffers.add(p.value.name);
          }
        });
        /** The name `stdout`/`stderr` when `n` reads the output buffer of a run() result. */
        const bufferName = (n: Node): string | null => {
          const value = unwrap(n);
          if (value.type === "Identifier") return buffers.has(value.name) ? value.name : null;
          if (
            value.type === "MemberExpression" &&
            !value.computed &&
            value.property.type === "Identifier" &&
            (value.property.name === "stdout" || value.property.name === "stderr") &&
            (isRunResult(value.object) ||
              (unwrap(value.object).type === "Identifier" &&
                results.has((unwrap(value.object) as ESTree.IdentifierReference).name)))
          )
            return value.property.name;
          return null;
        };
        const report = (n: Node, name: string | null) => {
          if (name !== null) context.report({ node: n, messageId: "buffer", data: { name } });
        };
        walk(program, (n) => {
          if (n.type === "TemplateLiteral") for (const e of n.expressions) report(e, bufferName(e));
          else if (n.type === "BinaryExpression" && n.operator === "+") {
            report(n.left, bufferName(n.left as Node));
            report(n.right, bufferName(n.right));
          } else if (n.type === "CallExpression") {
            const callee = n.callee;
            if (
              callee.type === "MemberExpression" &&
              !callee.computed &&
              callee.property.type === "Identifier"
            ) {
              const name = bufferName(callee.object);
              if (name !== null && STRING_METHODS.has(callee.property.name))
                report(callee.object, name);
              const object = callee.object;
              if (
                object.type === "Identifier" &&
                object.name === "JSON" &&
                callee.property.name === "stringify" &&
                n.arguments[0] &&
                n.arguments[0].type !== "SpreadElement"
              )
                report(n.arguments[0], bufferName(n.arguments[0]));
            }
          }
        });
      },
    };
  },
});
