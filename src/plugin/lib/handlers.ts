import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ESTree } from "vite-plus/lint/plugins";
import type { ImportBinding } from "./ast.ts";

type Node = ESTree.Node;

const SKIP_KEYS = new Set(["parent", "loc", "range", "start", "end", "type"]);

function isNode(value: unknown): value is Node {
  return typeof value === "object" && value !== null && typeof (value as Node).type === "string";
}

/**
 * Visits `node` and every node below it, handing each its parent. `visit` returns `false`
 * to skip the children of that node.
 */
export function walk(
  node: Node,
  visit: (node: Node, parent: Node | null) => boolean | void,
  parent: Node | null = null,
): void {
  if (visit(node, parent) === false) return;
  for (const [key, value] of Object.entries(node)) {
    if (SKIP_KEYS.has(key)) continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) walk(item, visit, node);
    } else if (isNode(value)) walk(value, visit, node);
  }
}

export type Fn = ESTree.Function | ESTree.ArrowFunctionExpression;

export function isFunction(node: Node): node is Fn {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

/** The local names `name` is imported under from one of `sources`. */
export function localNames(
  bindings: Map<string, ImportBinding>,
  name: string,
  sources: readonly string[],
): Set<string> {
  const names = new Set<string>();
  for (const [local, binding] of bindings)
    if (binding.imported === name && sources.includes(binding.source)) names.add(local);
  return names;
}

/** A call whose callee is one of the plain identifiers `names`. */
export function isCallTo(node: Node, names: Set<string>): node is ESTree.CallExpression {
  return node.type === "CallExpression" && node.callee.type === "Identifier"
    ? names.has(node.callee.name)
    : false;
}

/** `defineHandler`'s local names, as Void's two entry points export it. */
export function defineHandlerNames(bindings: Map<string, ImportBinding>): Set<string> {
  return localNames(bindings, "defineHandler", ["void", "void/handler"]);
}

/** The literal specifiers a file loads: static imports, re-exports, `import()` and `require()`. */
export function moduleSpecifiers(program: ESTree.Program): ESTree.StringLiteral[] {
  const found: ESTree.StringLiteral[] = [];
  const add = (node: Node | null | undefined) => {
    if (node?.type === "Literal" && typeof node.value === "string")
      found.push(node as ESTree.StringLiteral);
  };
  walk(program, (node) => {
    if (node.type === "ImportDeclaration") add(node.source);
    else if (node.type === "ExportAllDeclaration") add(node.source);
    else if (node.type === "ExportNamedDeclaration") add(node.source);
    else if (node.type === "ImportExpression") add(node.source);
    else if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "require"
    )
      add(node.arguments[0]);
  });
  return found;
}

export type PackageInfo = {
  dir: string;
  dependencies: Set<string>;
  /** `name` → version range, across dependencies, devDependencies, peerDependencies. */
  ranges: Map<string, string>;
};

const packages = new Map<string, PackageInfo | null>();

/** The nearest `package.json` above a file, read once per directory. Null when there is none. */
export function nearestPackage(context: { filename: string; cwd?: string }): PackageInfo | null {
  const file = path.resolve(context.cwd ?? process.cwd(), context.filename);
  const start = path.dirname(file);
  const cached = packages.get(start);
  if (cached !== undefined) return cached;
  let result: PackageInfo | null = null;
  for (let dir = start; ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest)) {
      try {
        const json = JSON.parse(readFileSync(manifest, "utf8")) as Record<string, unknown>;
        const ranges = new Map<string, string>();
        for (const key of [
          "dependencies",
          "devDependencies",
          "peerDependencies",
          "optionalDependencies",
        ]) {
          const table = json[key];
          if (typeof table === "object" && table !== null)
            for (const [name, range] of Object.entries(table)) ranges.set(name, String(range));
        }
        result = { dir, dependencies: new Set(ranges.keys()), ranges };
      } catch {
        result = null;
      }
      break;
    }
    if (path.dirname(dir) === dir) break;
  }
  packages.set(start, result);
  return result;
}

/** The text of the first of `names` that exists in `dir`, or null. */
export function readFirst(dir: string, names: readonly string[]): string | null {
  for (const name of names) {
    const file = path.join(dir, name);
    if (existsSync(file))
      try {
        return readFileSync(file, "utf8");
      } catch {
        return null;
      }
  }
  return null;
}
