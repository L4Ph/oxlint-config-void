import type { ESTree } from "vite-plus/lint/plugins";

type Node = ESTree.Node;

/** What a local name was imported as, from where. */
export type ImportBinding = {
  source: string;
  /** The exported name (`default` for a default import, `*` for a namespace import). */
  imported: string;
  /** `import type` or an inline `type` specifier. */
  typeOnly: boolean;
  node: ESTree.ImportDeclaration;
};

/** Every binding the file's import declarations create, by local name. */
export function importBindings(program: ESTree.Program): Map<string, ImportBinding> {
  const bindings = new Map<string, ImportBinding>();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = String(statement.source.value);
    const declarationTypeOnly = statement.importKind === "type";
    for (const specifier of statement.specifiers) {
      const imported =
        specifier.type === "ImportDefaultSpecifier"
          ? "default"
          : specifier.type === "ImportNamespaceSpecifier"
            ? "*"
            : specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : String(specifier.imported.value);
      const typeOnly =
        declarationTypeOnly ||
        (specifier.type === "ImportSpecifier" && specifier.importKind === "type");
      bindings.set(specifier.local.name, { source, imported, typeOnly, node: statement });
    }
  }
  return bindings;
}

/** The expression under `as`, `satisfies`, `!` and parentheses. */
export function unwrap(node: Node): Node {
  let current = node;
  for (;;) {
    if (
      current.type === "TSAsExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "TSTypeAssertion" ||
      current.type === "ParenthesizedExpression"
    ) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

/**
 * The name a call is made through: `f` for `f()`, `a.b.c` for `a.b.c()`. Null for
 * anything computed.
 */
export function calleeName(node: Node): string | null {
  const callee = node.type === "CallExpression" ? node.callee : node;
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    const object = calleeName(callee.object);
    return object === null ? null : `${object}.${callee.property.name}`;
  }
  return null;
}

/**
 * True when `node` calls `name` and that name is bound, in this file, to the export
 * `name` of one of `sources`. `defineHandler.withValidator(...)(...)` counts as a call of
 * `defineHandler`.
 */
export function isCallOf(
  node: Node,
  name: string,
  sources: readonly string[],
  bindings: Map<string, ImportBinding>,
): boolean {
  let current = unwrap(node);
  while (current.type === "CallExpression") {
    const called = calleeName(current);
    if (called !== null) {
      const root = called.split(".")[0] ?? "";
      const binding = bindings.get(root);
      return binding !== undefined && binding.imported === name && sources.includes(binding.source);
    }
    current = unwrap(current.callee);
  }
  return false;
}

/** The value a top-level `const name = …` is initialised with, when the file declares one. */
export function topLevelConst(program: ESTree.Program, name: string): Node | null {
  for (const statement of program.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type !== "VariableDeclaration") continue;
    for (const declarator of declaration.declarations)
      if (declarator.id.type === "Identifier" && declarator.id.name === name)
        return declarator.init ?? null;
  }
  return null;
}

/**
 * The expression the file default-exports, following one identifier to a top-level
 * `const` of the same file. Null when there is no default export.
 */
export function defaultExport(program: ESTree.Program): { node: Node; value: Node } | null {
  for (const statement of program.body) {
    if (statement.type !== "ExportDefaultDeclaration") continue;
    const declared = unwrap(statement.declaration as Node);
    if (declared.type === "Identifier") {
      const bound = topLevelConst(program, declared.name);
      return { node: statement, value: bound === null ? declared : unwrap(bound) };
    }
    return { node: statement, value: declared };
  }
  return null;
}

/** The file's named value exports: the name and, for `export const`, the initialiser. */
export function namedExports(
  program: ESTree.Program,
): Map<string, { node: Node; init: Node | null }> {
  const exports = new Map<string, { node: Node; init: Node | null }>();
  for (const statement of program.body) {
    if (statement.type !== "ExportNamedDeclaration" || statement.exportKind === "type") continue;
    const declaration = statement.declaration;
    if (declaration?.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations)
        if (declarator.id.type === "Identifier")
          exports.set(declarator.id.name, { node: declarator, init: declarator.init ?? null });
    } else if (declaration?.type === "FunctionDeclaration" && declaration.id) {
      exports.set(declaration.id.name, { node: declaration, init: null });
    }
    for (const specifier of statement.specifiers) {
      if (specifier.exportKind === "type") continue;
      const exported =
        specifier.exported.type === "Identifier"
          ? specifier.exported.name
          : String(specifier.exported.value);
      exports.set(exported, { node: specifier, init: null });
    }
  }
  return exports;
}

/** The property `name` of an object literal (not a spread, not computed). */
export function property(object: Node, name: string): ESTree.ObjectProperty | null {
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

/** The value at a dotted path of nested object literals, such as `routing.typedRoutes`. */
export function valueAt(object: Node, path: string): Node | null {
  let current: Node = object;
  for (const key of path.split(".")) {
    const member = property(unwrap(current), key);
    if (member === null) return null;
    current = member.value;
  }
  return unwrap(current);
}

/** A string the source spells out: a string literal, or a template with no expressions. */
export function staticString(node: Node): string | null {
  const value = unwrap(node);
  if (value.type === "Literal" && typeof value.value === "string") return value.value;
  if (value.type === "TemplateLiteral" && value.expressions.length === 0)
    return value.quasis[0]?.value.cooked ?? null;
  return null;
}
