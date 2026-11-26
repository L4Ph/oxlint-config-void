import type { ESTree } from "vite-plus/lint/plugins";
import { isCallOf, property, unwrap, type ImportBinding } from "./ast.ts";

type Node = ESTree.Node;

/**
 * True when `node` calls `name` from one of `sources`. A bare `name(...)` with no import
 * of that name in the file also counts (snippets, and auto-imports), but a name imported
 * from anywhere else does not.
 */
export function callsVoid(
  node: Node,
  name: string,
  sources: readonly string[],
  bindings: Map<string, ImportBinding>,
): boolean {
  if (node.type !== "CallExpression") return false;
  if (isCallOf(node, name, sources, bindings)) return true;
  return node.callee.type === "Identifier" && node.callee.name === name && !bindings.has(name);
}

/** `db` when it is not imported from somewhere other than `void/db`. */
export function isDbIdentifier(node: Node, bindings: Map<string, ImportBinding>): boolean {
  if (node.type !== "Identifier" || node.name !== "db") return false;
  const binding = bindings.get("db");
  return binding === undefined || (binding.source === "void/db" && binding.imported === "db");
}

/** The nodes `session` can be, looking through a conditional's branches. */
export function sessionValues(options: Node | undefined): Node[] {
  if (!options) return [];
  const member = property(unwrap(options), "session");
  if (member === null) return [];
  const out: Node[] = [];
  const walk = (node: Node) => {
    const value = unwrap(node);
    if (value.type === "ConditionalExpression") {
      walk(value.consequent);
      walk(value.alternate);
    } else out.push(value);
  };
  walk(member.value);
  return out;
}
