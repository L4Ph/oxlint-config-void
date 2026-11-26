import { namedExports } from "../../lib/ast.ts";
import { HTTP_METHODS, scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

/**
 * Void registers every file of `routes/` that is not skipped by a leading `_` or `.`. A file
 * with `export * from` is left alone: it may re-export the handlers.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export at least one HTTP-method handler from every route file; prefix helpers with `_`.",
      norms: ["reference/structure/5", "guide-core/server-routing/3"],
      scope: "void",
    },
    messages: {
      none: "`{{path}}` is in `routes/` but exports no HTTP-method handler (GET, POST, PUT, PATCH, DELETE, ...), so Void registers a route that answers nothing. Export a handler, or rename the file to start with `_` if it is a helper. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = scanned(context, "routes");
    if (!file || /\.ws\.[^.]+$/.test(file.name) || file.segments.some((s) => s.startsWith(".")))
      return {};
    return {
      Program(program) {
        if (program.body.some((s) => s.type === "ExportAllDeclaration")) return;
        const exported = namedExports(program);
        if (!HTTP_METHODS.some((method) => exported.has(method)))
          context.report({ node: program, messageId: "none", data: { path: file.path } });
      },
    };
  },
});
