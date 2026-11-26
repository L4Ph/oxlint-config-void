import { defaultExport, importBindings } from "../../lib/ast.ts";
import { callsImported, JOB_EXTENSION, scanned, VOID_SOURCES } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const QUEUE_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

/**
 * A queue consumer is a file of `queues/` and its path (below `queues/`, extension dropped,
 * `/` as `-`) is the queue's name. A file elsewhere is reported only when it default-exports
 * `defineQueue(...)`; the name and extension are read only for files that do.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put a queue consumer in queues/ as a .ts, .mts, .js or .mjs file whose path makes a valid Cloudflare queue name.",
      norms: [
        "services/queues/1",
        "edge-integrations/frameworks-tanstack-start/5",
        "services/queues/3",
      ],
      scope: "any",
    },
    messages: {
      outside:
        "`{{path}}` default-exports a queue consumer, but Void registers consumers only from `queues/`. Move it to `queues/<name>.ts`. See guide/queues.md.",
      extension:
        "`{{name}}` is a queue consumer with an extension Void does not read in `queues/`. Rename it to `.ts`, `.mts`, `.js` or `.mjs`. See guide/queues.md.",
      name: "The path `{{path}}` makes the queue name `{{queue}}`, which Cloudflare rejects: a queue name is 1 to 63 letters, digits and `-`, starting and ending with a letter or digit. Rename the file or its directories. See guide/queues.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const governed = scanned(context, "queues") !== null;
    if (file.dir === "queues" && !governed) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        const exported = defaultExport(program);
        if (!exported || !callsImported(exported.value, "defineQueue", VOID_SOURCES, bindings))
          return;
        if (file.dir !== "queues")
          return context.report({
            node: exported.node,
            messageId: "outside",
            data: { path: file.path },
          });
        if (!JOB_EXTENSION.test(file.name))
          return context.report({
            node: program,
            messageId: "extension",
            data: { name: file.name },
          });
        const below = file.segments
          .slice(1)
          .join("/")
          .replace(/\.[^./]+$/, "");
        const queue = below.replaceAll("/", "-");
        if (!QUEUE_NAME.test(queue))
          context.report({ node: program, messageId: "name", data: { path: file.path, queue } });
      },
    };
  },
});
