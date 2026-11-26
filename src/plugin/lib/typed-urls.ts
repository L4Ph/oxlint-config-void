import type { Context, ESTree } from "vite-plus/lint/plugins";
import { type ImportBinding, calleeName, isCallOf } from "./ast.ts";
import { ADAPTERS, initOf, memberName, strip } from "./forms-actions.ts";

type Node = ESTree.Node;

export type Destination = {
  /** The argument or attribute value, as written (casts included). */
  value: Node;
  kind: "link" | "router" | "redirect";
};

/**
 * Where a URL is handed to Void's navigation: a `Link`'s `href` (`Link` imported from an
 * adapter), the first argument of `visit` / `prefetch` / `flush` on a `useRouter()`
 * result, or the first argument of `c.redirect(...)`.
 */
export function destinationOf(
  context: Context,
  node: Node,
  bindings: Map<string, ImportBinding>,
): Destination | null {
  if (node.type === "JSXAttribute") {
    const element = node.parent;
    if (
      node.name.type !== "JSXIdentifier" ||
      node.name.name !== "href" ||
      element.type !== "JSXOpeningElement" ||
      element.name.type !== "JSXIdentifier"
    )
      return null;
    const link = bindings.get(element.name.name);
    if (!link || link.imported !== "Link" || !(ADAPTERS as readonly string[]).includes(link.source))
      return null;
    const value = node.value;
    if (!value) return null;
    return {
      value: value.type === "JSXExpressionContainer" ? value.expression : value,
      kind: "link",
    };
  }
  if (node.type !== "CallExpression" || !node.arguments[0]) return null;
  const callee = strip(node.callee);
  if (calleeName(callee) === "c.redirect") return { value: node.arguments[0], kind: "redirect" };
  const method = memberName(callee);
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    (method === "visit" || method === "prefetch" || method === "flush")
  ) {
    const init = initOf(context, callee.object);
    if (init !== null && isCallOf(strip(init), "useRouter", ADAPTERS, bindings))
      return { value: node.arguments[0], kind: "router" };
  }
  return null;
}
