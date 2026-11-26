import { locate } from "../../lib/project.ts";
import { isBrowserFile, sourceText, valueImportSource } from "../../lib/server-client-boundary.ts";
import { defineRule } from "../../rule.ts";

const SERVER_SPECIFIER = /^\.\.?\/(?:.*\/)?[^/]*\.server(?:\.[cm]?[jt]sx?)?$/;

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import from a `.server` file with `import type` only in page components.",
      norms: ["guide-core/type-safety/3"],
      scope: "void",
    },
    messages: {
      value:
        "`{{source}}` is a server file and this one runs in the browser. Write `import type { Props } from '{{source}}'` so nothing of it is bundled. See guide/type-safety.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isBrowserFile(file)) return {};
    return {
      ImportDeclaration(node) {
        const source = sourceText(valueImportSource(node));
        if (source !== null && SERVER_SPECIFIER.test(source))
          context.report({ node, messageId: "value", data: { source } });
      },
    };
  },
});
