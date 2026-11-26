import type { ESTree } from "vite-plus/lint/plugins";
import { type ImportBinding, isCallOf, unwrap } from "./ast.ts";
import { isPrivate, type Location } from "./project.ts";

type Node = ESTree.Node;
export type Fn = (ESTree.Function | ESTree.ArrowFunctionExpression) & { body: Node };

const WS_ROUTE = /\.ws\.[cm]?[jt]sx?$/;

/** A typed WebSocket route: `routes/**\/<name>.ws.<ext>`, not skipped by Void's scan. */
export function isWsRoute(file: Location | null): boolean {
  return (
    file !== null && file.dir === "routes" && WS_ROUTE.test(file.name) && !isPrivate(file.segments)
  );
}

/** Calls `visit` on every node below `root`; a `false` result skips that node's children. */
export function walk(root: Node, visit: (node: Node) => boolean | void): void {
  if (visit(root) === false) return;
  for (const [key, value] of Object.entries(root)) {
    if (key === "parent" || key === "loc" || key === "range") continue;
    for (const child of Array.isArray(value) ? value : [value])
      if (child && typeof child === "object" && typeof (child as Node).type === "string")
        walk(child as Node, visit);
  }
}

/** The function an object-literal value is: a method, an arrow or a function expression. */
export function fnOf(node: Node | null | undefined): Fn | null {
  const value = node ? unwrap(node) : null;
  return value && (value.type === "ArrowFunctionExpression" || value.type === "FunctionExpression")
    ? (value as Fn)
    : null;
}

/** The name of a non-computed object property key. */
export function keyName(member: ESTree.ObjectProperty): string | null {
  const key = member.key;
  if (member.computed) return null;
  if (key.type === "Identifier") return key.name;
  return key.type === "Literal" ? String(key.value) : null;
}

/** The function-valued properties of an object literal, by name. */
export function functionMembers(object: Node | null | undefined): Map<string, Fn> {
  const found = new Map<string, Fn>();
  if (object?.type !== "ObjectExpression") return found;
  for (const member of object.properties) {
    if (member.type !== "Property") continue;
    const name = keyName(member);
    const fn = fnOf(member.value);
    if (name !== null && fn) found.set(name, fn);
  }
  return found;
}

/** The first argument of a call when it is an object literal. */
export function optionsOf(call: ESTree.CallExpression): ESTree.ObjectExpression | null {
  const first = call.arguments[0];
  const value = first && first.type !== "SpreadElement" ? unwrap(first) : null;
  return value?.type === "ObjectExpression" ? value : null;
}

/** True when an object literal has a spread, so its keys are not all known. */
export function hasSpread(object: ESTree.ObjectExpression): boolean {
  return object.properties.some((member) => member.type !== "Property");
}

/** Walks a function's own code, leaving out the functions nested in it. */
export function walkOwn(fn: Fn, visit: (node: Node) => boolean | void): void {
  walk(fn.body, (node) => {
    if (
      node !== fn.body &&
      (node.type === "ArrowFunctionExpression" ||
        node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration")
    )
      return false;
    return visit(node);
  });
}

/** The expressions a function returns (an arrow's expression body, or every `return x`). */
export function returned(fn: Fn): Node[] {
  if (fn.body.type !== "BlockStatement") return [fn.body];
  const values: Node[] = [];
  walkOwn(fn, (node) => {
    if (node.type === "ReturnStatement" && node.argument) values.push(node.argument);
  });
  return values;
}

/** The name of a function's first parameter, when it is a plain identifier. */
export function firstParam(fn: Fn): string | null {
  const first = fn.params[0];
  return first?.type === "Identifier" ? first.name : null;
}

/** The `defineRoom` / `defineWebSocket` calls of a file (from `void/ws`), with their options. */
export function wsDefinition(
  node: Node,
  bindings: Map<string, ImportBinding>,
  names: ("defineRoom" | "defineWebSocket")[] = ["defineRoom", "defineWebSocket"],
): ESTree.CallExpression | null {
  if (node.type !== "CallExpression") return null;
  return names.some((name) => isCallOf(node, name, ["void/ws"], bindings)) ? node : null;
}

/** The `start` callback of an `eventStream(...)` call: its first function argument. */
export function startCallback(call: ESTree.CallExpression): Fn | null {
  for (const argument of call.arguments) {
    const fn = argument.type === "SpreadElement" ? null : fnOf(argument);
    if (fn) return fn;
  }
  return null;
}

type Scoped = { sourceCode: { getScope(node: Node): ScopeLike } };
type ScopeLike = { set: Map<string, VariableLike>; upper: ScopeLike | null };
type VariableLike = { defs: { type: string; node: Node; parent?: Node | null }[] };

/** The initialiser of the `const` of this file that `name` refers to at `at`; null for anything else. */
export function constInit(context: Scoped, at: Node & { name: string }): Node | null {
  for (let scope: ScopeLike | null = context.sourceCode.getScope(at); scope; scope = scope.upper) {
    const def = scope.set.get(at.name)?.defs[0];
    if (!def) continue;
    const declarator = def.node;
    const declaration = def.parent;
    return def.type === "Variable" &&
      declarator.type === "VariableDeclarator" &&
      declaration?.type === "VariableDeclaration" &&
      declaration.kind === "const"
      ? declarator.init
      : null;
  }
  return null;
}
