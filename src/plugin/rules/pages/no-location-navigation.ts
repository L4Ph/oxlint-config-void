import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, staticString } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const LOCATION = new Set([
  "location",
  "window.location",
  "document.location",
  "globalThis.location",
]);

/** A path inside the app: one `/`, not `//host`. */
const internal = (node: Node | undefined): boolean => {
  const text = node && node.type !== "SpreadElement" ? staticString(node) : null;
  return text !== null && /^\/(?!\/)/.test(text);
};

/** The dotted name of a member expression (`window.location.href`), or null. */
const dotted = (node: Node): string | null => calleeName(node);

/**
 * "For programmatic navigation, use `useRouter()`" (guide/pages-routing/overview.md:313).
 * An island page has no router, and an island component sits in a private file that is
 * not told apart from any other, so only the page and layout components are read.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Navigate to a page of the app with useRouter().visit(), not by assigning window.location.",
      norms: ["pages-routing/overview/20"],
      scope: "void",
    },
    messages: {
      location:
        "Assigning `{{target}}` to a path of this app reloads the document and drops the page's client state. Call `useRouter().visit('{{path}}')` from your adapter instead. See guide/pages-routing/overview.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (!kind.pageComponent || kind.private || kind.island || kind.test) return {};
    const report = (node: Node, target: string, value: Node | undefined) =>
      context.report({
        node,
        messageId: "location",
        data: {
          target,
          path: (value && value.type !== "SpreadElement" && staticString(value)) || "/path",
        },
      });
    return {
      AssignmentExpression(node) {
        const name = dotted(node.left);
        if (name === null || node.operator !== "=") return;
        const base = name.endsWith(".href") ? name.slice(0, -5) : name;
        if (LOCATION.has(base) && internal(node.right)) report(node, name, node.right);
      },
      CallExpression(node) {
        const name = calleeName(node);
        if (name === null) return;
        const dot = name.lastIndexOf(".");
        const method = name.slice(dot + 1);
        if (
          (method === "assign" || method === "replace") &&
          LOCATION.has(name.slice(0, dot)) &&
          internal(node.arguments[0])
        )
          report(node, `${name.slice(0, dot)}.${method}()`, node.arguments[0]);
      },
    };
  },
});
