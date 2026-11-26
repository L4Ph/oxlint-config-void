import { locate } from "../../lib/project.ts";
import { isBrowserFile, sourceText, valueImportSource } from "../../lib/server-client-boundary.ts";
import { defineRule } from "../../rule.ts";

/** Server-only modules the docs name, with the page that says so. */
const SERVER_ONLY: Record<string, string> = {
  "void/db": "guide/index.md",
  "void/auth": "guide/index.md",
  "void/storage": "guide/index.md",
  "void/kv": "guide/index.md",
  "void/ai": "guide/ai.md",
  "void/live": "guide/live.md",
  "void/ws/server": "guide/websockets.md",
};

/**
 * Narrower than the plan: only the modules the cited pages call server-only
 * (`void/sandbox`, `void/queues` and `void/email` are not named there).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep server-only Void modules out of page components and other browser code.",
      norms: [
        "guide-core/guide-index/2",
        "guide-core/guide-index/3",
        "services/ai/1",
        "services/live/2",
        "services/websockets/14",
      ],
      scope: "void",
    },
    messages: {
      server:
        "`{{module}}` is server-only and this file runs in the browser. Read the data in the page's `.server.ts` loader and pass it as props; for live streams use `void/live/client`. See {{page}}.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isBrowserFile(file)) return {};
    const check = (node: Parameters<typeof valueImportSource>[0]) => {
      const source = valueImportSource(node);
      const module = sourceText(source);
      const page = module === null ? undefined : SERVER_ONLY[module];
      if (source && module && page)
        context.report({ node, messageId: "server", data: { module, page } });
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
});
