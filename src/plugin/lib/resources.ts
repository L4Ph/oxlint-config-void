import type { ESTree } from "vite-plus/lint/plugins";

type Node = ESTree.Node;

/** The node's ancestors, nearest first. The linter sets `parent` on every node. */
export function ancestors(node: Node): Node[] {
  const result: Node[] = [];
  let current = (node as { parent?: Node }).parent;
  while (current) {
    result.push(current);
    current = (current as { parent?: Node }).parent;
  }
  return result;
}

export function isFunction(node: Node): boolean {
  return (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  );
}

/**
 * True when `node` sits in the `try { }` block of some TryStatement (not in its catch or
 * finally). shortcut: crosses function boundaries, so a try around a callback counts; silent is safer.
 */
export function inTryBlock(node: Node): boolean {
  let child: Node = node;
  for (const parent of ancestors(node)) {
    if (parent.type === "TryStatement" && parent.block === child) return true;
    child = parent;
  }
  return false;
}

/** True when the call is the object of a chained `.catch(...)` call. */
export function hasCatchChain(node: Node): boolean {
  const parent = (node as { parent?: Node }).parent;
  if (parent?.type === "AwaitExpression") return hasCatchChain(parent);
  return (
    parent?.type === "MemberExpression" &&
    !parent.computed &&
    parent.property.type === "Identifier" &&
    parent.property.name === "catch"
  );
}

/** `obj.method(...)` with `obj` an Identifier: [objectName, methodName], else null. */
export function methodCall(node: Node): [string, string] | null {
  if (node.type !== "CallExpression") return null;
  const callee = node.callee;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.property.type === "Identifier"
  )
    return [callee.object.name, callee.property.name];
  return null;
}
