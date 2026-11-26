import { isConfigFile, isEnvFile } from "../../lib/env.ts";
import { defineRule } from "../../rule.ts";

const ALIAS = /^(?:@\/|~\/|#)|\?[\w-]+(?:=.*)?$/;

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Import only relative paths or packages in void.config.ts and env.ts: no tsconfig path aliases, no Vite query imports.",
      norms: ["reference/config/3", "guide-core/env-vars/16"],
      scope: "void",
    },
    messages: {
      alias:
        "`{{source}}` is a path alias or a Vite-transformed import, and `{{file}}` is loaded outside Vite's module graph. Import it by a relative path (`./lib/theme`) or a package name. See reference/config.md and guide/env-vars.md.",
    },
    schema: [],
  },
  create(context) {
    const file = isConfigFile(context) ? "void.config.ts" : isEnvFile(context) ? "env.ts" : null;
    if (file === null) return {};
    const check = (source: { value?: unknown } | null | undefined, node: object) => {
      if (typeof source?.value === "string" && ALIAS.test(source.value))
        context.report({
          node: node as never,
          messageId: "alias",
          data: { source: source.value, file },
        });
    };
    return {
      ImportDeclaration: (node) => check(node.source, node.source),
      ExportNamedDeclaration: (node) => check(node.source, node.source ?? node),
      ExportAllDeclaration: (node) => check(node.source, node.source),
      ImportExpression: (node) => check(node.source as { value?: unknown }, node.source),
    };
  },
});
