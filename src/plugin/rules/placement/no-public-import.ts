import path from "node:path";
import { rootRelative } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

const SCRIPT = /\.[cm]?[jt]sx?$/;

/**
 * Narrower than the plan: a specifier is reported only when it resolves, from the file's
 * own directory (or from the root, for `/public/…`), into the project's `public/`. A bare
 * `public/…` specifier or a `…/public/…` inside a package is not followed.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Reference files in public/ by their root path; do not import them as modules.",
      norms: ["reference/structure/20"],
      scope: "void",
    },
    messages: {
      imported:
        '`{{specifier}}` imports a file from `public/`, which Vite does not process. Reference it by its root path instead, such as `src="/{{rest}}"`, or move the file next to the code and import it from there. See reference/structure.md.',
    },
    schema: [],
  },
  create(context) {
    const file = rootRelative(context);
    if (!file) return {};
    const check = (source: ESTree.Node | null | undefined) => {
      if (source?.type !== "Literal" || typeof source.value !== "string") return;
      const specifier = source.value;
      const clean = specifier.split(/[?#]/)[0] ?? "";
      let target: string | null = null;
      if (clean.startsWith("/")) target = clean.slice(1);
      else if (clean.startsWith("."))
        target = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), clean));
      if (target === null || !target.startsWith("public/")) return;
      const extension = path.posix.extname(target);
      if (extension === "" || SCRIPT.test(target)) return;
      context.report({
        node: source,
        messageId: "imported",
        data: { specifier, rest: target.slice("public/".length) },
      });
    };
    return {
      ImportDeclaration(node) {
        if (node.importKind !== "type") check(node.source);
      },
      ExportNamedDeclaration(node) {
        check(node.source);
      },
      ExportAllDeclaration(node) {
        check(node.source);
      },
      ImportExpression(node) {
        check(node.source);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require")
          check(node.arguments[0]);
      },
    };
  },
});
