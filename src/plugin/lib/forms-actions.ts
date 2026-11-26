import type { Context, ESTree, Scope, Variable } from "vite-plus/lint/plugins";
import { describe, locate } from "./project.ts";
import { type ImportBinding, isCallOf, unwrap } from "./ast.ts";

type Node = ESTree.Node;

/** The packages whose `useForm`, `action`, `Link`, `useRouter` … Void documents. */
export const ADAPTERS = ["@void/react", "@void/vue", "@void/svelte", "@void/solid"] as const;

/** The expression under casts, parentheses and an optional chain. */
export function strip(node: Node): Node {
  let current = unwrap(node);
  while (current.type === "ChainExpression") current = unwrap(current.expression);
  return current;
}

export type AnyFunction = ESTree.Function | ESTree.ArrowFunctionExpression;

export function isFunction(node: Node): node is AnyFunction {
  return (
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration"
  );
}

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

/** Depth-first walk of a subtree; `visit` returns `false` to skip a node's children. */
export function walk(node: Node, visit: (node: Node) => boolean | void): void {
  if (visit(node) === false) return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) walk(item, visit);
    } else if (isNode(value)) walk(value, visit);
  }
}

/** True for a file of browser code: not a server companion, not a test, not a server directory. */
export function isClientFile(context: Context): boolean {
  const file = locate(context);
  if (!file) return false;
  const kind = describe(file);
  if (kind.serverCompanion || kind.test) return false;
  return kind.convention === null || kind.convention === "pages";
}

/** True when some import of the file comes from one of `sources`. */
export function importsFrom(bindings: Map<string, ImportBinding>, sources: readonly string[]) {
  for (const binding of bindings.values()) if (sources.includes(binding.source)) return true;
  return false;
}

/** The variable `id` refers to, found from the scope it sits in. */
export function variableOf(context: Context, id: Node): Variable | null {
  if (id.type !== "Identifier") return null;
  for (let scope: Scope | null = context.sourceCode.getScope(id); scope; scope = scope.upper) {
    const variable = scope.set.get(id.name);
    if (variable) return variable;
  }
  return null;
}

/** The initialiser of the `const`/`let` the identifier names, in this file. */
export function initOf(context: Context, id: Node): Node | null {
  const def = variableOf(context, id)?.defs[0];
  if (def?.type !== "Variable" || def.node.type !== "VariableDeclarator") return null;
  return def.node.id.type === "Identifier" ? def.node.init : null;
}

/** True when `id` names a variable initialised by `await? hook(...)` of one of the import sources. */
export function isHookResult(
  context: Context,
  id: Node,
  hook: string,
  sources: readonly string[],
  bindings: Map<string, ImportBinding>,
): boolean {
  const init = initOf(context, id);
  return init !== null && isCallOf(strip(init), hook, sources, bindings);
}

/** The property of an object literal, by name, looking at `Property` nodes only. */
export function propertyNamed(object: Node, name: string): ESTree.ObjectProperty | null {
  if (object.type !== "ObjectExpression") return null;
  for (const member of object.properties) {
    if (member.type !== "Property" || member.computed) continue;
    const key = member.key;
    if (
      (key.type === "Identifier" && key.name === name) ||
      (key.type === "Literal" && key.value === name)
    )
      return member;
  }
  return null;
}

export function hasSpread(object: Node): boolean {
  return (
    object.type === "ObjectExpression" && object.properties.some((p) => p.type === "SpreadElement")
  );
}

/** The name of a non-computed `.name` property of a member expression. */
export function memberName(node: Node): string | null {
  if (node.type !== "MemberExpression" || node.computed) return null;
  return node.property.type === "Identifier" ? node.property.name : null;
}

/** The value of a `useForm` call's options object (third argument), when written as a literal. */
export function formOptions(call: ESTree.CallExpression): Node | null {
  const options = call.arguments[2];
  return options ? strip(options) : null;
}
