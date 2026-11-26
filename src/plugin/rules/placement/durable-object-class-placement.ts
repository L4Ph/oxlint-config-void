import { importBindings } from "../../lib/ast.ts";
import { callsImported, defaultValue, scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

/**
 * Narrower than the plan: only modules inside `durable-objects/` are read. The docs name
 * `durable-objects/` as where Void finds Durable Objects, but a class defined elsewhere and
 * wrapped there is not ruled out, so a class outside is not reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Wrap a native Durable Object class in a durable-objects/ module with defineDurableObject and default-export it.",
      norms: ["edge-integrations/cloudflare/4", "services/durable-state/19"],
      scope: "void",
    },
    messages: {
      unwrapped:
        "`{{name}}` extends a Cloudflare Durable Object class in `durable-objects/`, but the module never calls `defineDurableObject`, so Void does not bind or export it. Add `export const {{name}}Object = defineDurableObject({ name: '...', class: {{name}} });` and default-export it. See guide/durable-state.md.",
      notDefault:
        "This module in `durable-objects/` defines `{{name}}` but has no default export, so Void does not register it. Default-export the `defineDurableObject(...)` result. See guide/durable-state.md.",
    },
    schema: [],
  },
  create(context) {
    if (!scanned(context, "durable-objects")) return {};
    const bindings = importBindings(context.sourceCode.ast);
    const classes: { node: ESTree.Class; name: string }[] = [];
    let wrapped = false;
    const visitClass = (node: ESTree.Class) => {
      const parent = node.superClass;
      if (parent?.type !== "Identifier") return;
      const binding = bindings.get(parent.name);
      const native =
        binding &&
        ((binding.source === "cloudflare:workers" && binding.imported === "DurableObject") ||
          (binding.source === "agents" && binding.imported === "Agent"));
      if (native) classes.push({ node, name: node.id?.name ?? "DurableObjectClass" });
    };
    return {
      ClassDeclaration: visitClass,
      ClassExpression: visitClass,
      CallExpression(node) {
        if (callsImported(node, "defineDurableObject", ["void/durable"], bindings)) wrapped = true;
      },
      "Program:exit"(program) {
        const first = classes[0];
        if (!first) return;
        if (!wrapped)
          context.report({ node: first.node, messageId: "unwrapped", data: { name: first.name } });
        else if (!defaultValue(program))
          context.report({ node: first.node, messageId: "notDefault", data: { name: first.name } });
      },
    };
  },
});
