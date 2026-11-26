import type { ESTree } from "vite-plus/lint/plugins";
import { isCallOf, property, unwrap, type ImportBinding } from "./ast.ts";

type Node = ESTree.Node;

/** True when `node` calls `name` and the file imported that name from one of `sources`. */
export function callsVoid(
  node: Node,
  name: string,
  sources: readonly string[],
  bindings: Map<string, ImportBinding>,
): boolean {
  return node.type === "CallExpression" && isCallOf(node, name, sources, bindings);
}

/** `db`, when the file imported it from `void/db`. */
export function isDbIdentifier(node: Node, bindings: Map<string, ImportBinding>): boolean {
  if (node.type !== "Identifier" || node.name !== "db") return false;
  const binding = bindings.get("db");
  return binding !== undefined && binding.source === "void/db" && binding.imported === "db";
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
