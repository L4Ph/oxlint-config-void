import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, staticString } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/** Calls `visit(node, ancestors)` for every node, parents first; `ancestors` is nearest-last. */
function walk(
  node: unknown,
  visit: (n: Node, ancestors: Node[]) => void,
  ancestors: Node[] = [],
): void {
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit, ancestors);
    return;
  }
  if (node === null || typeof node !== "object" || typeof (node as Node).type !== "string") return;
  visit(node as Node, ancestors);
  const next = [...ancestors, node as Node];
  for (const [key, value] of Object.entries(node)) if (key !== "parent") walk(value, visit, next);
}

/**
 * `sendEmail()` returns a result and does not throw, so a `try`/`catch` or a discarded call sees
 * no failure. A result tested with `.ok` must then be read for both failure shapes: `error` (the
 * request) and `deliveries` (single recipients).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Inspect the result of sendEmail() (both result.error and result.deliveries) instead of discarding it or relying on try/catch.",
      norms: ["services/sending/1", "services/sending/23"],
      scope: "void",
    },
    messages: {
      discarded:
        "`sendEmail()` returns a result and does not throw; this call drops it, so a failed send goes unseen. Keep it (`const result = await sendEmail(...)`) and check `result.ok`. See guide/email/sending.md.",
      caught:
        "`sendEmail()` returns a result instead of throwing, so this `catch` never runs for a failed send. Keep the result and check `result.ok`, `result.error` and `result.deliveries`. See guide/email/sending.md.",
      bothShapes:
        "`{{name}}` is tested with `.ok` but not read for {{missing}}. A failed result has either `error` (the request failed) or `deliveries` (single recipients failed), so check both. See guide/email/sending.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    if (
      ![...bindings.values()].some((b) => b.imported === "sendEmail" && b.source === "void/email")
    )
      return {};
    const isSend = (n: Node): n is ESTree.CallExpression => {
      if (n.type !== "CallExpression" || n.callee.type !== "Identifier") return false;
      const binding = bindings.get(n.callee.name);
      return binding?.imported === "sendEmail" && binding.source === "void/email";
    };
    return {
      "Program:exit"(program) {
        const results = new Map<string, ESTree.CallExpression>();
        walk(program, (n, ancestors) => {
          if (!isSend(n)) return;
          const parent = ancestors.at(-1);
          const awaited = parent?.type === "AwaitExpression";
          const holder = awaited ? ancestors.at(-2) : parent;
          if (holder?.type === "ExpressionStatement") {
            // Inside a try block, up to the nearest function.
            let caught = false;
            for (let i = ancestors.length - 1; i > 0; i--) {
              const ancestor = ancestors[i] as Node;
              if (/Function/.test(ancestor.type)) break;
              const above = ancestors[i - 1] as Node;
              if (above.type === "TryStatement" && above.block === ancestor) caught = true;
            }
            context.report({ node: n, messageId: caught ? "caught" : "discarded" });
          } else if (
            awaited &&
            holder?.type === "VariableDeclarator" &&
            holder.id.type === "Identifier"
          )
            results.set(holder.id.name, n);
        });
        if (results.size === 0) return;
        const read = new Map<string, { props: Set<string>; escapes: boolean }>();
        for (const name of results.keys()) read.set(name, { props: new Set(), escapes: false });
        walk(program, (n, ancestors) => {
          if (n.type !== "Identifier") return;
          const use = read.get(n.name);
          const parent = ancestors.at(-1);
          if (!use || !parent) return;
          if (parent.type === "VariableDeclarator" && parent.id === n) return;
          if (parent.type === "MemberExpression" && parent.object === n) {
            const prop = parent.computed
              ? staticString(parent.property)
              : (parent.property as ESTree.IdentifierName).name;
            if (prop === null) use.escapes = true;
            else use.props.add(prop);
          } else if (
            parent.type === "MemberExpression" &&
            parent.property === n &&
            !parent.computed
          ) {
            // `x.r`: not the variable.
          } else if (
            parent.type === "BinaryExpression" &&
            parent.operator === "in" &&
            parent.right === n
          ) {
            const prop = staticString(parent.left as Node);
            if (prop === null) use.escapes = true;
            else use.props.add(prop);
          } else if (
            parent.type === "Property" &&
            parent.key === n &&
            !parent.shorthand &&
            !parent.computed
          ) {
            // `{ r: 1 }`: a key.
          } else use.escapes = true;
        });
        for (const [name, call] of results) {
          const use = read.get(name);
          if (!use || use.escapes || !use.props.has("ok")) continue;
          const missing = ["error", "deliveries"].filter((prop) => !use.props.has(prop));
          if (missing.length > 0)
            context.report({
              node: call,
              messageId: "bothShapes",
              data: { name, missing: missing.map((m) => `\`${m}\``).join(" or ") },
            });
        }
      },
    };
  },
});
