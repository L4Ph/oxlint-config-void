import { describe, isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

/** The suffix of a relative specifier's last segment, for a route or page file (not a `_` helper). */
function suffixOf(specifier: string): "dev" | "prod" | null {
  if (!specifier.startsWith(".")) return null;
  const segments = specifier.split(/[?#]/)[0]?.split("/") ?? [];
  if (segments.some((segment) => segment.startsWith("_"))) return null;
  const last = (segments[segments.length - 1] ?? "").replace(/\.[cm]?[jt]sx?$/, "");
  const match = /\.(dev|prod)$/.exec(last);
  return match ? (match[1] as "dev" | "prod") : null;
}

/**
 * A `.dev` route or page exists only in development, a `.prod` one only in production, so
 * a file that exists in both must not import either. Only relative specifiers that name a
 * route or page file are read: a `_` helper is not scanned, so its suffix is the author's own.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not import a .dev module from code that ships to production, nor a .prod module from dev code.",
      norms: ["reference/structure/6", "reference/structure/8"],
      scope: "void",
    },
    messages: {
      crossing:
        "`{{path}}` imports `{{specifier}}`, a `.{{env}}`-only file, but this file {{ships}}. Import it only from a file with the same `.{{env}}` suffix, or move the shared code to a `_` helper. See reference/structure.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || (file.dir !== "routes" && file.dir !== "pages") || isTestFile(file.name))
      return {};
    const own = describe(file).environment;
    const check = (source: ESTree.Node | null | undefined) => {
      if (source?.type !== "Literal" || typeof source.value !== "string") return;
      const env = suffixOf(source.value);
      if (env && env !== own)
        context.report({
          node: source,
          messageId: "crossing",
          data: {
            path: file.path,
            specifier: source.value,
            env,
            ships: own
              ? `exists only with the \`.${own}\` suffix`
              : "ships to both development and production",
          },
        });
    };
    return {
      ImportDeclaration(node) {
        if (node.importKind !== "type") check(node.source);
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind !== "type") check(node.source);
      },
      ExportAllDeclaration(node) {
        if (node.exportKind !== "type") check(node.source);
      },
      ImportExpression(node) {
        check(node.source);
      },
    };
  },
});
