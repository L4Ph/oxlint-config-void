import { usesVitePlus } from "../../lib/testing.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "With Vite+, import test APIs from 'vite-plus/test', not 'vitest'.",
      norms: ["guide-core/testing/1"],
      scope: "any",
    },
    messages: {
      vitest:
        "This project uses Vite+, where test APIs come from `vite-plus/test`. Replace `{{source}}` with `vite-plus/test`. See guide/testing.md.",
    },
    schema: [],
  },
  create(context) {
    let vitePlus: boolean | undefined;
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (source !== "vitest" && !source.startsWith("vitest/")) return;
        vitePlus ??= usesVitePlus(context.filename, context.cwd ?? process.cwd());
        if (vitePlus) context.report({ node: node.source, messageId: "vitest", data: { source } });
      },
    };
  },
});
