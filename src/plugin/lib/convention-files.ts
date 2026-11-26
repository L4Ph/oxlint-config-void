import type { ESTree } from "vite-plus/lint/plugins";
import { defaultExport, namedExports, type ImportBinding, unwrap } from "./ast.ts";
import { isPrivate, isTestFile, locate, type Location } from "./project.ts";

type Node = ESTree.Node;

/** Where `defineHandler`, `defineMiddleware`, `defineQueue`, `defineScheduled` and `defineRender` come from. */
export const VOID_SOURCES = ["void", "void/handler"] as const;

/** The extensions Void reads for crons/ and queues/ files. */
export const JOB_EXTENSION = /\.(?:ts|mts|js|mjs)$/;
const DECLARATION_FILE = /\.d\.[cm]?ts$/;

type Located = Parameters<typeof locate>[0];

/**
 * A file Void scans in `dir`: it sits in that convention directory, no segment below it
 * starts with `_`, and it is neither a test nor a declaration file.
 */
export function scanned(context: Located, dir: string): Location | null {
  const file = locate(context);
  if (!file || file.dir !== dir) return null;
  if (isPrivate(file.segments) || isTestFile(file.name) || DECLARATION_FILE.test(file.name))
    return null;
  return file;
}

/**
 * The file's path relative to the project root, ignoring `settings.void.sourceDir`:
 * `public/`, `src/main.ssr.tsx` and a stray `routes/` sit there whatever `sourceDir` is.
 */
export function rootRelative(context: Located): Location | null {
  const settings = context.settings?.void as { root?: string } | undefined;
  return locate({
    filename: context.filename,
    cwd: context.cwd,
    settings: settings?.root ? { void: { root: settings.root } } : undefined,
  });
}

/** True when `node` is `name(...)` and `name` is bound to that export of one of `sources`. */
export function callsImported(
  node: Node,
  name: string,
  sources: readonly string[],
  bindings: Map<string, ImportBinding>,
): boolean {
  if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return false;
  const binding = bindings.get(node.callee.name);
  return (
    binding !== undefined &&
    !binding.typeOnly &&
    binding.imported === name &&
    sources.includes(binding.source)
  );
}

/**
 * The file's default export: `export default <value>` (an identifier is followed to a
 * top-level `const` of the same file) or `export { x as default }`, whose value is not
 * followed (`value` is then the specifier).
 */
export function defaultValue(program: ESTree.Program): { node: Node; value: Node } | null {
  const declared = defaultExport(program);
  if (declared) return declared;
  const specifier = namedExports(program).get("default");
  return specifier ? { node: specifier.node, value: specifier.node } : null;
}

const PLAIN = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "FunctionDeclaration",
  "ClassDeclaration",
  "ClassExpression",
  "ObjectExpression",
  "ArrayExpression",
  "Literal",
  "TemplateLiteral",
]);

/** A value that is certainly not a call: a function, class, object, array or literal. */
export function isPlain(value: Node): boolean {
  return PLAIN.has(value.type);
}

/** The file's top-level function-valued binding `name` (declaration or `const name = () => …`). */
export function isFunctionNode(node: Node): boolean {
  const value = unwrap(node);
  return (
    value.type === "ArrowFunctionExpression" ||
    value.type === "FunctionExpression" ||
    value.type === "FunctionDeclaration"
  );
}

/** Calls `visit` for `node` and every node below it, with its parent. */
export function walk(node: Node, visit: (node: Node, parent: Node | null) => void): void {
  const go = (current: Node, parent: Node | null) => {
    visit(current, parent);
    for (const [key, child] of Object.entries(current)) {
      if (key === "parent" || key === "loc" || key === "range") continue;
      for (const item of Array.isArray(child) ? child : [child])
        if (item && typeof item === "object" && typeof item.type === "string")
          go(item as Node, current);
    }
  };
  go(node, null);
}

/** The type arguments of a call (`defineQueue<Message>(…)`), under either name the parser uses. */
export function typeArguments(call: ESTree.CallExpression): unknown {
  const raw = call as unknown as { typeArguments?: unknown; typeParameters?: unknown };
  return raw.typeArguments ?? raw.typeParameters ?? null;
}

/** The HTTP method names a route file exports handlers under. */
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

type Reporter = {
  report(descriptor: { node: Node; messageId: string; data?: Record<string, string> }): void;
};

/**
 * Reports a file with no default export (on the Program) or whose default export is
 * certainly not a call (on the export). A call of anything else, an imported name or an
 * identifier that cannot be followed is left alone.
 */
export function checkDefaultExport(
  context: Reporter,
  program: ESTree.Program,
  messageIds: { missing: string; plain: string },
  data?: Record<string, string>,
): void {
  const exported = defaultValue(program);
  if (!exported) context.report({ node: program, messageId: messageIds.missing, data });
  else if (isPlain(exported.value))
    context.report({ node: exported.node, messageId: messageIds.plain, data });
}
