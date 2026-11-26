import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

const SERVER_DIRS = ["routes", "middleware", "queues", "crons", "email"];

/** Calls `visit` for every node below `node`. */
function walk(node: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (node === null || typeof node !== "object" || typeof (node as Node).type !== "string") return;
  visit(node as Node);
  for (const [key, value] of Object.entries(node)) if (key !== "parent") walk(value, visit);
}

/** `<param>.<path…>` as a dotted string, or null for any other expression. */
function memberPath(node: Node): string | null {
  const value = unwrap(node);
  if (value.type === "Identifier") return value.name;
  if (value.type !== "MemberExpression" || value.computed || value.property.type !== "Identifier")
    return null;
  const object = memberPath(value.object);
  return object === null ? null : `${object}.${value.property.name}`;
}

/**
 * A usage limit is the class `UsageLimit` of `void/limits`, found with `instanceof`. A handler
 * that catches it returns `error.response()` and rethrows everything else.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Import UsageLimit from void/limits, detect it with instanceof, and rethrow the errors that are not one.",
      norms: ["services/ai/15", "services/ai/16", "services/ai/17", "services/sandboxes/13"],
      scope: "void",
    },
    messages: {
      source:
        "`UsageLimit` is imported from '{{source}}'. Import it from 'void/limits': `import { UsageLimit } from 'void/limits'`, so `instanceof` matches the error Void throws. See guide/ai.md.",
      byName:
        "A usage limit is found with `error instanceof UsageLimit` (from 'void/limits'), not by its name or message, which can change. See guide/ai.md.",
      rethrow:
        "This `catch` handles `UsageLimit` but never rethrows, so every other error is swallowed too. End it with `throw error;` after the `instanceof UsageLimit` branch. See guide/ai.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    const kind = file ? describe(file) : null;
    const server =
      kind !== null &&
      !kind.private &&
      (kind.serverCompanion || SERVER_DIRS.includes(kind.convention ?? ""));
    const bindings = importBindings(context.sourceCode.ast);
    const isUsageLimit = (node: Node) => {
      const value = unwrap(node);
      return (
        value.type === "Identifier" &&
        (value.name === "UsageLimit" || bindings.get(value.name)?.imported === "UsageLimit")
      );
    };
    const reported = new Set<Node>();
    const report = (node: Node, messageId: "byName" | "rethrow") => {
      if (reported.has(node)) return;
      reported.add(node);
      context.report({ node, messageId });
    };
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        // shortcut: only relative paths are known to be wrong; a package may legitimately re-export it.
        if (!source.startsWith(".") && !source.startsWith("/")) return;
        for (const specifier of node.specifiers)
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.type === "Identifier" &&
            specifier.imported.name === "UsageLimit" &&
            specifier.importKind !== "type"
          )
            context.report({ node: specifier, messageId: "source", data: { source } });
      },
      CatchClause(node) {
        const param = node.param?.type === "Identifier" ? node.param.name : null;
        let instanceCheck = false;
        let throws = false;
        walk(node.body, (n) => {
          if (n.type === "ThrowStatement") throws = true;
          if (param === null) return;
          if (n.type === "BinaryExpression") {
            if (
              n.operator === "instanceof" &&
              isUsageLimit(n.right) &&
              memberPath(n.left as Node) === param
            )
              instanceCheck = true;
            if (["===", "==", "!==", "!="].includes(n.operator)) {
              for (const [a, b] of [
                [n.left as Node, n.right],
                [n.right, n.left as Node],
              ] as const) {
                const path = memberPath(a);
                const literal = staticString(b);
                if (path === null || literal === null) continue;
                if (
                  (path === `${param}.name` || path === `${param}.constructor.name`) &&
                  (literal === "UsageLimit" || literal === "SandboxLimitError")
                )
                  report(n, "byName");
                if (path === `${param}.message` && /limit/i.test(literal)) report(n, "byName");
              }
            }
          } else if (n.type === "CallExpression") {
            const callee = n.callee;
            const first = n.arguments[0];
            const literal = first && first.type !== "SpreadElement" ? staticString(first) : null;
            if (
              callee.type === "MemberExpression" &&
              !callee.computed &&
              callee.property.type === "Identifier" &&
              ["includes", "startsWith", "endsWith"].includes(callee.property.name) &&
              memberPath(callee.object) === `${param}.message` &&
              literal !== null &&
              /limit/i.test(literal)
            )
              report(n, "byName");
          }
        });
        if (server && instanceCheck && !throws) report(node, "rethrow");
      },
    };
  },
});
