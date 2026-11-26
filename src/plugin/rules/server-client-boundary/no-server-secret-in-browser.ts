import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, staticString } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { isBrowserFile } from "../../lib/server-client-boundary.ts";
import { defineRule } from "../../rule.ts";

const TRUSTED_KEY = "AUTH_TRUSTED_KEY";

/** The key a member access `env.KEY` / `env["KEY"]` reads, and the node that names it. */
function keyOf(node: ESTree.MemberExpression): { name: string; at: ESTree.Node } | null {
  if (!node.computed && node.property.type === "Identifier")
    return { name: node.property.name, at: node.property };
  const name = node.computed ? staticString(node.property) : null;
  return name === null ? null : { name, at: node.property };
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep non-`VITE_` env keys and `AUTH_TRUSTED_KEY` out of browser code.",
      norms: ["reference/env/4", "guide-core/auth/28"],
      scope: "void",
    },
    messages: {
      env: "`env.{{key}}` is a server value and this file runs in the browser. Read it in the page's `.server.ts` loader, or name the key `VITE_{{key}}` if it is public. See reference/api/env.md.",
      trustedKey:
        "`AUTH_TRUSTED_KEY` lifts the auth rate limit for whoever sends it. Never reference it in code that reaches users' browsers; keep it in `auth.ts` and your test runner. See guide/auth.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isBrowserFile(file)) return {};
    let envNames = new Set<string>();
    return {
      Program(program) {
        envNames = new Set(
          [...importBindings(program)]
            .filter(([, b]) => b.source === "void/env" && b.imported === "env")
            .map(([local]) => local),
        );
      },
      MemberExpression(node) {
        if (node.object.type !== "Identifier" || !envNames.has(node.object.name)) return;
        const key = keyOf(node);
        if (!key || key.name.startsWith("VITE_")) return;
        if (key.name === TRUSTED_KEY) return; // the Identifier / Literal visitors report it
        context.report({ node, messageId: "env", data: { key: key.name } });
      },
      Identifier(node) {
        if (node.name === TRUSTED_KEY) context.report({ node, messageId: "trustedKey" });
      },
      Literal(node) {
        if (node.value === TRUSTED_KEY) context.report({ node, messageId: "trustedKey" });
      },
    };
  },
});
