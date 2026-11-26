import type { ESTree } from "vite-plus/lint/plugins";
import { describe, type Location } from "./project.ts";

const SERVER_NAME = /\.server\.[cm]?[jt]sx?$/;

/**
 * Code that runs in the browser: every non-test file under `pages/` that is not a
 * `.server.*` file (components, `_components`, `_features`, `_lib`, layouts), and every
 * `<name>.island.*` file.
 */
export function isBrowserFile(file: Location): boolean {
  const kind = describe(file);
  if (kind.test || SERVER_NAME.test(file.name)) return false;
  return file.dir === "pages" || kind.island;
}

/** True for `import type …` and for an import whose specifiers are all `type` specifiers. */
export function isTypeOnlyImport(node: ESTree.ImportDeclaration): boolean {
  return (
    node.importKind === "type" ||
    (node.specifiers.length > 0 &&
      node.specifiers.every((s) => s.type === "ImportSpecifier" && s.importKind === "type"))
  );
}

/** The module specifier of a value import, re-export or `import("…")` with a string source; null for anything else. */
export function valueImportSource(node: ESTree.Node): ESTree.Node | null {
  switch (node.type) {
    case "ImportDeclaration":
      return isTypeOnlyImport(node) ? null : node.source;
    case "ExportNamedDeclaration":
      return node.source && node.exportKind !== "type" ? node.source : null;
    case "ExportAllDeclaration":
      return node.exportKind !== "type" ? node.source : null;
    case "ImportExpression":
      return node.source;
    default:
      return null;
  }
}

/** The string a source node spells out. */
export function sourceText(node: ESTree.Node | null): string | null {
  return node?.type === "Literal" && typeof node.value === "string" ? node.value : null;
}
