import { defineRule } from "../../rule.ts";

/**
 * Narrower than the plan, which also reports `import { connectLiveStream } from './live'`:
 * a relative module may re-export the browser helper, and the page only says which
 * Void module has it. Only a `void/*` module other than `void/live/client` is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import `connectLiveStream` from `void/live/client`.",
      norms: ["services/live/9"],
      scope: "void",
    },
    messages: {
      source:
        "`connectLiveStream` is the browser helper of `void/live/client`, not of `{{source}}` (which is server-only). Import it with `import { connectLiveStream } from 'void/live/client'`. See guide/live.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (!source.startsWith("void/") || source === "void/live/client") return;
        for (const specifier of node.specifiers)
          if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.type === "Identifier" &&
            specifier.imported.name === "connectLiveStream"
          )
            context.report({ node: specifier, messageId: "source", data: { source } });
      },
    };
  },
});
