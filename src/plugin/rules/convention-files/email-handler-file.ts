import { importBindings } from "../../lib/ast.ts";
import { callsImported, checkDefaultExport } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * Inbound mail handlers are the flat files of the top-level `email/` directory. Unlike the
 * other convention directories, `email/_default.ts` is a handler (the fallback), so a
 * leading `_` does not make a file a helper there except for names other than `_default`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Write inbound email handlers as flat files in the top-level email/ directory, default-exporting defineEmail(...).",
      norms: ["services/receiving/1", "services/receiving/10", "services/receiving/3"],
      scope: "void",
    },
    messages: {
      location:
        "`defineEmail(...)` is called in `{{path}}`, but Void reads inbound mail handlers only from the top-level `email/` directory. Move it to `email/<recipient>.ts`. See guide/email/receiving.md.",
      nested:
        "`{{path}}` is nested below `email/`, and Void ignores nested folders there: the recipient is a flat string, not a path. Move the handler to `email/<recipient>.ts`. See guide/email/receiving.md.",
      missing:
        "This file in `email/` has no default export, so it handles no mail. Write `export default defineEmail(async (message, env, ctx) => { ... })`. See guide/email/receiving.md.",
      plain:
        "The default export of this `email/` file is not a `defineEmail(...)` call. Wrap the handler: `export default defineEmail(async (message, env, ctx) => { ... })`. See guide/email/receiving.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const inside = file.dir === "email";
    const flat = inside && file.segments.length === 2;
    const handler = flat && (!file.name.startsWith("_") || file.name.startsWith("_default."));
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        if (handler) checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
      CallExpression(node) {
        if (!callsImported(node, "defineEmail", ["void/email"], bindings)) return;
        if (!inside) context.report({ node, messageId: "location", data: { path: file.path } });
        else if (!flat && !file.segments.slice(1).some((segment) => segment.startsWith("_")))
          context.report({ node, messageId: "nested", data: { path: file.path } });
      },
    };
  },
});
