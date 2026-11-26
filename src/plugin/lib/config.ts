import type { ESTree } from "vite-plus/lint/plugins";
import { defaultExport, property, staticString, topLevelConst, unwrap } from "./ast.ts";

type Node = ESTree.Node;
export type Property = ESTree.ObjectProperty;

const VOID_CONFIG = /^void\.config\.(?:ts|mts|js|mjs)$/;
const VITE_CONFIG = /^vite\.config\.[cm]?[jt]s$/;

/** The last path segment, whatever the separator. */
export function baseName(filename: string): string {
  return filename.split(/[\\/]/).pop() ?? "";
}

/** `void.config.{ts,mts,js,mjs}`. */
export function isVoidConfig(filename: string): boolean {
  return VOID_CONFIG.test(baseName(filename));
}

/** `vite.config.{ts,mts,cts,js,mjs,cjs}`. */
export function isViteConfig(filename: string): boolean {
  return VITE_CONFIG.test(baseName(filename));
}

function returnedObject(fn: ESTree.Function | ESTree.ArrowFunctionExpression): Node | null {
  const body = fn.body;
  if (body === null || body === undefined) return null;
  if (body.type !== "BlockStatement") return unwrap(body);
  for (const statement of body.body.toReversed())
    if (statement.type === "ReturnStatement" && statement.argument)
      return unwrap(statement.argument);
  return null;
}

/**
 * The object literal a config file default-exports: the literal itself, the first argument
 * of the call that wraps it (`defineConfig({...})`), or the object a function returns
 * (`defineConfig(() => ({...}))`). One identifier is followed to a top-level `const`.
 * Null for anything assembled another way.
 */
export function configObject(program: ESTree.Program): ESTree.ObjectExpression | null {
  const exported = defaultExport(program);
  if (exported === null) return null;
  let value: Node | null = exported.value;
  if (value.type === "CallExpression") {
    const first = value.arguments[0];
    value = first === undefined || first.type === "SpreadElement" ? null : unwrap(first);
  }
  if (value?.type === "Identifier") {
    const bound = topLevelConst(program, value.name);
    value = bound === null ? null : unwrap(bound);
  }
  if (
    value?.type === "ArrowFunctionExpression" ||
    value?.type === "FunctionExpression" ||
    value?.type === "FunctionDeclaration"
  )
    value = returnedObject(value);
  return value?.type === "ObjectExpression" ? value : null;
}

/** The name of a non-computed property key. */
export function keyName(member: Property): string | null {
  if (member.computed) return null;
  if (member.key.type === "Identifier") return member.key.name;
  if (member.key.type === "Literal" && typeof member.key.value === "string")
    return member.key.value;
  if (member.key.type === "Literal" && typeof member.key.value === "number")
    return String(member.key.value);
  return null;
}

/**
 * The properties of an object literal with a name, and whether the object is `open`: it has
 * a spread or a computed key, so it can hold more than the literal shows.
 */
export function members(object: Node): { props: Property[]; open: boolean } {
  const props: Property[] = [];
  let open = false;
  if (object.type !== "ObjectExpression") return { props, open: true };
  for (const member of object.properties) {
    if (member.type !== "Property" || keyName(member) === null) open = true;
    else props.push(member);
  }
  return { props, open };
}

/** The property at a dotted path of nested object literals (`routing.headers`). */
export function at(object: Node, path: string): Property | null {
  let current: Node = object;
  let found: Property | null = null;
  for (const key of path.split(".")) {
    found = property(unwrap(current), key);
    if (found === null) return null;
    current = found.value;
  }
  return found;
}

/** The object literal at a dotted path, or null when absent or not a literal. */
export function objectAt(object: Node, path: string): ESTree.ObjectExpression | null {
  const found = at(object, path);
  const value = found === null ? null : unwrap(found.value);
  return value?.type === "ObjectExpression" ? value : null;
}

/** The array literal at a dotted path, or null when absent or not a literal. */
export function arrayAt(object: Node, path: string): ESTree.ArrayExpression | null {
  const found = at(object, path);
  const value = found === null ? null : unwrap(found.value);
  return value?.type === "ArrayExpression" ? value : null;
}

/** The string at a dotted path, when the source spells it out. */
export function stringAt(object: Node, path: string): string | null {
  const found = at(object, path);
  return found === null ? null : staticString(found.value);
}

/** The literal a node spells out (string, number, boolean, null, `-1`), or `undefined` when it is anything else. */
export function literal(node: Node): { value: unknown } | undefined {
  const value = unwrap(node);
  const text = staticString(value);
  if (text !== null) return { value: text };
  if (value.type === "Literal") return { value: value.value };
  if (
    value.type === "UnaryExpression" &&
    value.operator === "-" &&
    value.argument.type === "Literal" &&
    typeof value.argument.value === "number"
  )
    return { value: -value.argument.value };
  return undefined;
}

/** The strings an array literal holds, each with its node; null when it holds anything else. */
export function stringElements(
  array: ESTree.ArrayExpression,
): { node: Node; text: string }[] | null {
  const out: { node: Node; text: string }[] = [];
  for (const element of array.elements) {
    if (element === null || element.type === "SpreadElement") return null;
    const text = staticString(element);
    if (text === null) return null;
    out.push({ node: element, text });
  }
  return out;
}

/**
 * The elements of a `plugins` array when every one is a call to an imported or global
 * plugin function: an array with a spread, a variable, or a call to a function this file
 * or a relative module defines can hold a plugin the file does not show.
 */
export function pluginCalls(
  array: ESTree.ArrayExpression,
  bindings: Map<string, { source: string }>,
  program: ESTree.Program,
): ESTree.CallExpression[] | null {
  const calls: ESTree.CallExpression[] = [];
  for (const element of array.elements) {
    if (element === null || element.type === "SpreadElement") return null;
    const call = unwrap(element);
    if (call.type !== "CallExpression" || call.callee.type !== "Identifier") return null;
    const binding = bindings.get(call.callee.name);
    if (binding?.source.startsWith(".")) return null;
    if (binding === undefined && declaredHere(program, call.callee.name)) return null;
    calls.push(call);
  }
  return calls;
}

function declaredHere(program: ESTree.Program, name: string): boolean {
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type === "FunctionDeclaration" && declaration.id?.name === name) return true;
    if (declaration?.type === "VariableDeclaration")
      for (const declarator of declaration.declarations)
        if (declarator.id.type === "Identifier" && declarator.id.name === name) return true;
  }
  return false;
}
