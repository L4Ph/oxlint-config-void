import { importBindings, unwrap } from "../../lib/ast.ts";
import {
  callsImported,
  checkDefaultExport,
  scanned,
  typeArguments,
  VOID_SOURCES,
} from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

/**
 * A queue consumer is the default export of a `queues/` file, built with
 * `defineQueue<Message>(...)`. A `_` file that default-exports `defineQueue` is not
 * reported: it may be re-exported by a registered file.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Default-export defineQueue<Message>(...) from each file in queues/, with its message type.",
      norms: [
        "reference/structure/17",
        "services/queues/4",
        "services/queues/6",
        "cli/generate/13",
        "services/queues/5",
        "reference/handlers/12",
      ],
      scope: "void",
    },
    messages: {
      missing:
        "This file is in `queues/`, so Void registers it as a queue, but it has no default export. Write `export default defineQueue<Message>(async (batch, env) => { ... })`, or rename the file to start with `_` if it is a helper. See guide/queues.md.",
      plain:
        "The default export of this `queues/` file is not a `defineQueue(...)` call. Wrap the handler: `export default defineQueue<Message>(async (batch, env) => { ... })`. See guide/queues.md.",
      typeArgument:
        "`defineQueue` has no message type, so `queues.<name>.send()` is untyped. Write `defineQueue<Message>(...)`, with `Message` the type of a message body. See guide/queues.md.",
    },
    schema: [],
  },
  create(context) {
    if (!scanned(context, "queues")) return {};
    const bindings = importBindings(context.sourceCode.ast);
    const typed = /\.[cm]?tsx?$/.test(context.filename);
    return {
      Program(program) {
        checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
      CallExpression(node) {
        if (!typed || !callsImported(node, "defineQueue", VOID_SOURCES, bindings)) return;
        if (typeArguments(node) !== null) return;
        const handler = node.arguments[0] && unwrap(node.arguments[0]);
        if (handler?.type !== "ArrowFunctionExpression" && handler?.type !== "FunctionExpression")
          return;
        // A handler whose `batch` parameter is annotated (`QueueBatch<Message>`) is typed.
        if (handler.params[0]?.type === "Identifier" && handler.params[0].typeAnnotation) return;
        context.report({ node, messageId: "typeArgument" });
      },
    };
  },
});
