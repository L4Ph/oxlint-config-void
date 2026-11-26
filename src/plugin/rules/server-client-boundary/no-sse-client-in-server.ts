import { describe, isTestFile, locate } from "../../lib/project.ts";
import { sourceText, valueImportSource } from "../../lib/server-client-boundary.ts";
import { defineRule } from "../../rule.ts";

const SERVER_DIRS = ["routes", "middleware", "queues", "crons", "email"];

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import `void/sse/client` only in browser code, never in server files.",
      norms: ["services/sse/8"],
      scope: "void",
    },
    messages: {
      client:
        "`void/sse/client` is the browser-only `EventSource` wrapper, and this is a server file. Send events with `eventStream` from `void/sse` here and connect from a page component. See guide/sse.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const server = SERVER_DIRS.includes(file.dir) || describe(file).serverCompanion;
    if (!server) return {};
    const check = (node: Parameters<typeof valueImportSource>[0]) => {
      if (sourceText(valueImportSource(node)) === "void/sse/client")
        context.report({ node, messageId: "client" });
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
});
