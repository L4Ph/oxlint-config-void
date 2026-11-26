import path from "node:path";
import type { ESTree, Rule } from "vite-plus/lint/plugins";
import { defaultExport, property, staticString, unwrap, type ImportBinding } from "./ast.ts";
import { locate } from "./project.ts";

type Node = ESTree.Node;
export type Context = Parameters<NonNullable<Rule["create"]>>[0];

/** The runtime helpers of Void that reach Cloudflare bindings. */
export const RESOURCES = ["void/db", "void/kv", "void/storage", "void/ai"] as const;

/** True for `<stem>.config.{ts,js,mts,mjs,cts,cjs}`. */
export function isConfigFile(context: Context, stem: string): boolean {
  return new RegExp(`^${stem}\\.config\\.[cm]?[jt]s$`).test(path.basename(context.filename));
}

/**
 * The file's path from the app's root, with forward slashes. Unlike `locate(...).path` it
 * ignores `settings.void.sourceDir`: a meta-framework names its own directories.
 */
export function rootPath(context: Context): string | null {
  const settings = (context.settings as { void?: Record<string, unknown> }).void;
  return (
    locate({
      filename: context.filename,
      cwd: context.cwd,
      settings: { void: { ...settings, sourceDir: undefined } },
    })?.path ?? null
  );
}

/** A function node of any of the three syntaxes. */
export type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

export function isFunction(node: Node): node is FunctionNode {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

/** The object literal a config file default-exports, through `defineConfig(...)` and a function form. */
export function configObject(program: ESTree.Program): ESTree.ObjectExpression | null {
  let value = defaultExport(program)?.value ?? null;
  if (value?.type === "CallExpression")
    value = value.arguments[0] ? unwrap(value.arguments[0]) : null;
  if (value && isFunction(value)) {
    const body = value.body;
    if (!body) value = null;
    else if (body.type === "BlockStatement") {
      const last = body.body.at(-1);
      value = last?.type === "ReturnStatement" && last.argument ? unwrap(last.argument) : null;
    } else value = unwrap(body);
  }
  return value?.type === "ObjectExpression" ? value : null;
}

/** True when the object has a spread: a property it does not list may still be there. */
export function hasSpread(object: ESTree.ObjectExpression): boolean {
  return object.properties.some((member) => member.type === "SpreadElement");
}

/** The strings of an array literal made only of string literals; null for anything else. */
export function stringArray(node: Node): string[] | null {
  const value = unwrap(node);
  if (value.type !== "ArrayExpression") return null;
  const strings: string[] = [];
  for (const element of value.elements) {
    const text = element && element.type !== "SpreadElement" ? staticString(element) : null;
    if (text === null) return null;
    strings.push(text);
  }
  return strings;
}

/** The call, when `node` calls a name the file imported as `imported` from a source `from` accepts. */
export function importedCall(
  node: Node,
  bindings: Map<string, ImportBinding>,
  imported: string,
  from: (source: string) => boolean,
): ESTree.CallExpression | null {
  const call = unwrap(node);
  if (call.type !== "CallExpression" || call.callee.type !== "Identifier") return null;
  const binding = bindings.get(call.callee.name);
  return binding !== undefined &&
    !binding.typeOnly &&
    binding.imported === imported &&
    from(binding.source)
    ? call
    : null;
}

/** The elements of the config's `plugins` array that are calls, in order. */
export function pluginCalls(config: ESTree.ObjectExpression): ESTree.CallExpression[] {
  const list = property(config, "plugins")?.value;
  const plugins = list ? unwrap(list) : null;
  if (plugins?.type !== "ArrayExpression") return [];
  return plugins.elements.flatMap((element) => {
    const call = element && element.type !== "SpreadElement" ? unwrap(element) : null;
    return call?.type === "CallExpression" ? [call] : [];
  });
}

/** The first argument of a call when it is an object literal. */
export function optionsOf(call: ESTree.CallExpression): ESTree.ObjectExpression | null {
  const first = call.arguments[0];
  const options = first && first.type !== "SpreadElement" ? unwrap(first) : null;
  return options?.type === "ObjectExpression" ? options : null;
}

/** The import declarations of `sources` that bring something in at run time. */
export function runtimeImports(
  program: ESTree.Program,
  sources: readonly string[],
): ESTree.ImportDeclaration[] {
  return program.body.filter(
    (statement): statement is ESTree.ImportDeclaration =>
      statement.type === "ImportDeclaration" &&
      statement.importKind !== "type" &&
      sources.includes(String(statement.source.value)) &&
      !(
        statement.specifiers.length > 0 &&
        statement.specifiers.every(
          (specifier) => specifier.type === "ImportSpecifier" && specifier.importKind === "type",
        )
      ),
  );
}

type Reference = {
  identifier: ESTree.IdentifierReference;
  resolved: { defs: { type: string }[] } | null;
};

/** Every reference the file's scopes recorded: identifiers that read or write a binding. */
export function references(context: Context): Reference[] {
  return context.sourceCode.scopeManager.scopes.flatMap(
    (scope) => scope.references as unknown as Reference[],
  );
}

/** True when the reference resolves to an `import` of the file. */
export function isImportReference(reference: Reference): boolean {
  return reference.resolved?.defs[0]?.type === "ImportBinding";
}

/** True when the reference resolves to no declaration of the file: a global. */
export function isGlobalReference(reference: Reference): boolean {
  return !reference.resolved || reference.resolved.defs.length === 0;
}

/** True when `inner` lies inside `outer`. */
export function within(inner: Node, outer: Node): boolean {
  return inner.range[0] >= outer.range[0] && inner.range[1] <= outer.range[1];
}

/** The function a file default-exports, following one identifier to a function of the same file. */
export function defaultExportedFunction(program: ESTree.Program): FunctionNode | null {
  for (const statement of program.body) {
    if (statement.type !== "ExportDefaultDeclaration") continue;
    const declared = unwrap(statement.declaration as Node);
    if (isFunction(declared)) return declared;
    if (declared.type !== "Identifier") return null;
    for (const top of program.body) {
      const inner = top.type === "ExportNamedDeclaration" ? top.declaration : top;
      if (inner?.type === "FunctionDeclaration" && inner.id?.name === declared.name) return inner;
      if (inner?.type === "VariableDeclaration")
        for (const declarator of inner.declarations) {
          const init = declarator.init ? unwrap(declarator.init) : null;
          if (declarator.id.type === "Identifier" && declarator.id.name === declared.name)
            return init && isFunction(init) ? init : null;
        }
    }
  }
  return null;
}
