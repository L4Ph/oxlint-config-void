import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, isCallOf, unwrap, type ImportBinding } from "./ast.ts";
import type { Location } from "./project.ts";

type Node = ESTree.Node;
type Bindings = Map<string, ImportBinding>;
type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

/** The runtime package of a Pages adapter. */
export const ADAPTER_RUNTIME = /^@void\/(?:react|vue|svelte|solid)$/;
/** The Vite plugin entry of a Pages adapter. */
export const ADAPTER_PLUGIN = /^@void\/(?:react|vue|svelte|solid)\/plugin$/;
/** Where `defineHandler` and `defer` come from. */
export const HANDLER_SOURCES = ["void", "void/handler"] as const;

/** True when the local name is bound to export `exported` of a module whose name `source` accepts. */
export function boundTo(
  bindings: Bindings,
  local: string,
  exported: string,
  source: RegExp | readonly string[],
): boolean {
  const binding = bindings.get(local);
  if (binding === undefined || binding.imported !== exported) return false;
  return Array.isArray(source)
    ? (source as readonly string[]).includes(binding.source)
    : (source as RegExp).test(binding.source);
}

/** The local name a call is made through, when it is a plain identifier call. */
export function calledIdentifier(node: Node): string | null {
  return node.type === "CallExpression" && node.callee.type === "Identifier"
    ? node.callee.name
    : null;
}

/** Calls `visit` on `node` and every node below it; `visit` returns false to skip a subtree. */
export function walk(
  node: unknown,
  visit: (node: Node, parent: Node | null) => boolean | void,
): void {
  const go = (current: unknown, parent: Node | null): void => {
    if (Array.isArray(current)) {
      for (const item of current) go(item, parent);
      return;
    }
    if (current === null || typeof current !== "object") return;
    const candidate = current as { type?: unknown };
    const isNode = typeof candidate.type === "string";
    if (isNode && visit(current as Node, parent) === false) return;
    for (const [key, value] of Object.entries(current)) {
      if (key === "parent" || key === "loc" || key === "range") continue;
      go(value, isNode ? (current as Node) : parent);
    }
  };
  go(node, null);
}

/** True when a type reference named `name` appears anywhere in `node`. */
export function mentionsType(node: unknown, name: string): boolean {
  let found = false;
  walk(node, (current) => {
    if (found) return false;
    if (
      current.type === "TSTypeReference" &&
      ((current.typeName.type === "Identifier" && current.typeName.name === name) ||
        (current.typeName.type === "TSQualifiedName" && current.typeName.right.name === name))
    )
      found = true;
    return !found;
  });
  return found;
}

/** The dynamic segments of a pages path: `[id]` and `[...slug]`. `ok` is false for any other use of `[`. */
export function dynamicParams(segments: string[]): {
  plain: string[];
  catchAll: string[];
  ok: boolean;
  dynamic: boolean;
} {
  const plain: string[] = [];
  const catchAll: string[] = [];
  let ok = true;
  let dynamic = false;
  for (const segment of segments) {
    if (!segment.includes("[")) continue;
    // `[slug].server.ts` -> `[slug]`: drop what follows the closing bracket.
    const stem = segment.slice(0, segment.lastIndexOf("]") + 1);
    dynamic = true;
    const rest = /^\[\.\.\.(\w+)\]$/.exec(stem);
    const single = /^\[(\w+)\]$/.exec(stem);
    if (rest) catchAll.push(rest[1] as string);
    else if (single) plain.push(single[1] as string);
    else ok = false;
  }
  return { plain, catchAll, ok, dynamic };
}

/** `src/main.ssr.*` (or `main.ssr.*` under a `sourceDir` of `src`): the custom SSR entry. */
export function isSsrEntry(file: Location): boolean {
  return (
    /^main\.ssr\.[cm]?[jt]sx?$/.test(file.name) &&
    (file.path === file.name || file.path === `src/${file.name}`)
  );
}

/** A TypeScript file: the only kind that can carry a type annotation. */
export function isTypeScript(name: string): boolean {
  return /\.(?:[cm]?ts|tsx)$/.test(name);
}

/** A `.tsx` / `.jsx` file. */
export function isJsx(name: string): boolean {
  return /\.[jt]sx$/.test(name);
}

/** The function the file default-exports, following one identifier to a function or `const` of the file. */
export function defaultComponent(program: ESTree.Program): FunctionNode | null {
  for (const statement of program.body) {
    if (statement.type !== "ExportDefaultDeclaration") continue;
    const declared = unwrap(statement.declaration as Node);
    if (declared.type === "Identifier") return topLevelFunction(program, declared.name);
    return asFunction(declared);
  }
  return null;
}

function asFunction(node: Node): FunctionNode | null {
  return node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
    ? node
    : null;
}

/** A top-level `function name() {}` or `const name = () => {}` of the file. */
export function topLevelFunction(program: ESTree.Program, name: string): FunctionNode | null {
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type === "FunctionDeclaration" && declaration.id?.name === name)
      return declaration;
    if (declaration?.type === "VariableDeclaration")
      for (const declarator of declaration.declarations)
        if (declarator.id.type === "Identifier" && declarator.id.name === name && declarator.init)
          return asFunction(unwrap(declarator.init));
  }
  return null;
}

/**
 * The values a function returns: the body of an arrow with an expression body, or the argument
 * of every `return` that belongs to the function itself (not to a function nested in it).
 */
export function returnedValues(fn: FunctionNode): Node[] {
  const body = fn.body;
  if (body === null || body === undefined) return [];
  if (body.type !== "BlockStatement") return [body as Node];
  const values: Node[] = [];
  walk(body, (node) => {
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    )
      return false;
    if (node.type === "ReturnStatement" && node.argument) values.push(node.argument);
    return true;
  });
  return values;
}

/**
 * The function given to `defineHandler(...)` or `defineHandler.withValidator(...)(...)`
 * (its last argument), when the call is Void's.
 */
export function handlerFunction(node: Node, bindings: Bindings): FunctionNode | null {
  const call = unwrap(node);
  if (call.type !== "CallExpression" || !isCallOf(call, "defineHandler", HANDLER_SOURCES, bindings))
    return null;
  const last = call.arguments[call.arguments.length - 1];
  return last === undefined ? null : asFunction(unwrap(last as Node));
}

/** The name of the first parameter of a function, when it is a plain identifier. */
export function firstParamName(fn: FunctionNode): string | null {
  const first = fn.params[0];
  return first?.type === "Identifier" ? first.name : null;
}

/** An `Identifier` or `Literal` key of a property, as the name it spells. */
export function keyName(property: ESTree.ObjectProperty): string | null {
  if (property.computed) return null;
  const key = property.key;
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
}

/** True when a JSX tag is `<Link>` bound to an adapter's `Link`. */
export function isAdapterLink(name: ESTree.JSXOpeningElement["name"], bindings: Bindings): boolean {
  return name.type === "JSXIdentifier" && boundTo(bindings, name.name, "Link", ADAPTER_RUNTIME);
}

/** The attribute `name` of a JSX opening element. */
export function jsxAttribute(
  element: ESTree.JSXOpeningElement,
  name: string,
): ESTree.JSXAttribute | null {
  for (const attribute of element.attributes)
    if (
      attribute.type === "JSXAttribute" &&
      attribute.name.type === "JSXIdentifier" &&
      attribute.name.name === name
    )
      return attribute;
  return null;
}

/**
 * The expression an attribute's value holds: the literal of `a="x"`, the expression of
 * `a={x}`, null for `a` with no value (a bare attribute is `true`).
 */
export function jsxValue(attribute: ESTree.JSXAttribute): Node | null {
  const value = attribute.value;
  if (value === null || value === undefined) return null;
  if (value.type === "JSXExpressionContainer")
    return value.expression.type === "JSXEmptyExpression" ? null : unwrap(value.expression as Node);
  return value as Node;
}

/** A call of an adapter's Vite plugin (`voidReact(...)`), and its options object. */
export function adapterPluginOptions(node: Node, bindings: Bindings): Node | null | undefined {
  const name = calledIdentifier(node);
  if (name === null || node.type !== "CallExpression") return undefined;
  const binding = bindings.get(name);
  if (
    !binding ||
    !ADAPTER_PLUGIN.test(binding.source) ||
    !/^void(?:React|Vue|Svelte|Solid)$/.test(binding.imported)
  )
    return undefined;
  const options = node.arguments[0];
  return options === undefined ? null : unwrap(options as Node);
}

/** True for a call such as `c.req.param(...)`: its dotted callee name. */
export function calleeEndsWith(node: Node, suffix: string): boolean {
  const name = calleeName(node);
  return name !== null && (name === suffix || name.endsWith(`.${suffix}`));
}
