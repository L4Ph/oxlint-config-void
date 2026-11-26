import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

// guide/sandboxes.md names these file operations; `rename` is the only one with two paths.
const FILE_OPS = new Set([
  "readFile",
  "writeFile",
  "stat",
  "lstat",
  "readDirectory",
  "mkdir",
  "rename",
  "remove",
]);

/**
 * `sandbox.run()` and `exec()` take `[executable, ...args]`, not a shell string, and
 * `sandbox.files.*` resolves a relative path only against an explicit `cwd`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Pass sandbox run/exec an argument array, and give relative sandbox.files paths a cwd.",
      norms: ["services/sandboxes/3", "services/sandboxes/7"],
      scope: "void",
    },
    messages: {
      shellString:
        "`{{method}}()` takes an array `[executable, ...args]`, not a string. Pass `['ls', '-la']`, or `['sh', '-c', command]` when you need shell syntax. See guide/sandboxes.md.",
      relativePath:
        "`files.{{method}}()` is given the relative path '{{path}}' without a `cwd` option. Pass `{ cwd: '/workspace' }` or write an absolute path. See guide/sandboxes.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    const isGetSandbox = (node: Node) => {
      if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return false;
      const binding = bindings.get(node.callee.name);
      return binding?.imported === "getSandbox" && binding.source === "void/sandbox";
    };
    if (
      ![...bindings.values()].some(
        (b) => b.imported === "getSandbox" && b.source === "void/sandbox",
      )
    )
      return {};
    const names = new Set<string>();
    const calls: ESTree.CallExpression[] = [];
    const isSandbox = (node: Node) => {
      let value = unwrap(node);
      if (value.type === "AwaitExpression") value = unwrap(value.argument);
      return value.type === "Identifier" ? names.has(value.name) : isGetSandbox(value);
    };
    return {
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.init && isSandbox(node.init))
          names.add(node.id.name);
      },
      CallExpression(node) {
        calls.push(node);
      },
      "Program:exit"() {
        for (const call of calls) {
          const callee = call.callee;
          if (callee.type !== "MemberExpression" || callee.computed) continue;
          if (callee.property.type !== "Identifier") continue;
          const method = callee.property.name;
          const first = call.arguments[0];
          if (!first || first.type === "SpreadElement") continue;
          if ((method === "run" || method === "exec") && isSandbox(callee.object)) {
            const arg = unwrap(first);
            if (arg.type === "TemplateLiteral" || staticString(arg) !== null)
              context.report({ node: first, messageId: "shellString", data: { method } });
            continue;
          }
          const files = unwrap(callee.object);
          if (
            !FILE_OPS.has(method) ||
            files.type !== "MemberExpression" ||
            files.computed ||
            files.property.type !== "Identifier" ||
            files.property.name !== "files" ||
            !isSandbox(files.object)
          )
            continue;
          const paths = method === "rename" ? call.arguments.slice(0, 2) : [first];
          const relative = paths
            .map((arg) => (arg.type === "SpreadElement" ? null : staticString(arg)))
            .find((value) => value !== null && !value.startsWith("/"));
          if (relative === undefined || relative === null) continue;
          // An options argument we cannot see into may carry `cwd`.
          // `writeFile(path, content, options)`: the second argument is the data.
          const rest = call.arguments.slice(method === "writeFile" ? 2 : paths.length);
          const hasCwd = rest.some((arg) => {
            const value = arg.type === "SpreadElement" ? arg : unwrap(arg);
            return value.type !== "ObjectExpression" || property(value, "cwd") !== null;
          });
          if (!hasCwd)
            context.report({
              node: call,
              messageId: "relativePath",
              data: { method, path: relative },
            });
        }
      },
    };
  },
});
