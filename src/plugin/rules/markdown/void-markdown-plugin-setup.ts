import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, unwrap, type ImportBinding } from "../../lib/ast.ts";
import { ADAPTER_PLUGIN, boundTo } from "../../lib/pages.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/**
 * guide/pages-routing/markdown.md:63: "Add the plugin to your Vite config **after** the
 * framework adapter"; line 467: "The `shiki.themes` option is deprecated. Use `themes`."
 * reference/api/pages.md:316: add `voidMarkdown()` to your Vite plugins.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call voidMarkdown() after the adapter plugin in the Vite config, and pass themes, not shiki.",
      norms: ["pages-routing/markdown/3", "reference/pages/37", "pages-routing/markdown/14"],
      scope: "void",
    },
    messages: {
      order:
        "`voidMarkdown()` comes before the adapter plugin. Move it after `{{adapter}}()` in `plugins`, so the adapter sees the Markdown pages. See guide/pages-routing/markdown.md.",
      unused:
        "`voidMarkdown` is imported but never called, so Markdown pages are not built. Add `voidMarkdown()` to the `plugins` array, after the adapter plugin. See reference/api/pages.md.",
      shiki:
        "The `shiki` option is deprecated. Pass `themes` directly: `voidMarkdown({ themes: { light: '...', dark: '...' } })`. See guide/pages-routing/markdown.md.",
    },
    schema: [],
  },
  create(context) {
    if (!/^vite\.config\.[cm]?[jt]s$/.test(context.filename.split(/[\\/]/).pop() ?? "")) return {};
    let bindings = new Map<string, ImportBinding>();
    let called = false;
    const isMarkdown = (name: string) =>
      boundTo(bindings, name, "voidMarkdown", ["@void/md/plugin"]);
    const adapterOf = (node: Node): string | null => {
      const call = unwrap(node.type === "SpreadElement" ? node.argument : node);
      if (call.type !== "CallExpression" || call.callee.type !== "Identifier") return null;
      const binding = bindings.get(call.callee.name);
      return binding && ADAPTER_PLUGIN.test(binding.source) ? call.callee.name : null;
    };
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      Property(node) {
        if (node.computed || node.key.type !== "Identifier" || node.key.name !== "plugins") return;
        const list = unwrap(node.value as Node);
        if (list.type !== "ArrayExpression") return;
        list.elements.forEach((element, index) => {
          if (element === null || element.type !== "CallExpression") return;
          if (element.callee.type !== "Identifier" || !isMarkdown(element.callee.name)) return;
          for (const later of list.elements.slice(index + 1)) {
            const adapter = later && adapterOf(later as Node);
            if (adapter) {
              context.report({ node: element, messageId: "order", data: { adapter } });
              return;
            }
          }
        });
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !isMarkdown(node.callee.name)) return;
        called = true;
        const options = node.arguments[0];
        const shiki = options && property(unwrap(options as Node), "shiki");
        if (shiki) context.report({ node: shiki, messageId: "shiki" });
      },
      "Program:exit"() {
        if (called) return;
        for (const [name, binding] of bindings)
          if (isMarkdown(name)) context.report({ node: binding.node, messageId: "unused" });
      },
    };
  },
});
