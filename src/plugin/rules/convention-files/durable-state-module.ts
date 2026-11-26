import { importBindings } from "../../lib/ast.ts";
import { callsImported, checkDefaultExport, scanned } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const NAMES = ["defineDurableState", "defineDurableObject"];

/**
 * Durable State and native Durable Object definitions live in `durable-objects/`, one per
 * module, as the default export. The docs also ask for a named export when other modules
 * call the object over typed RPC; whether any does is not visible from one file, so that
 * half is not checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call defineDurableState / defineDurableObject only in durable-objects/ modules, and default-export the result.",
      norms: [
        "reference/durable/1",
        "services/durable-state/1",
        "services/durable-state/3",
        "reference/structure/19",
        "reference/resource-inference/1",
        "reference/durable/2",
      ],
      scope: "void",
    },
    messages: {
      location:
        "`{{name}}(...)` is called in `{{path}}`, but Void finds Durable Objects only as modules in `durable-objects/`. Move it to `durable-objects/<name>.ts` and default-export it. See guide/durable-state.md.",
      missing:
        "This module in `durable-objects/` has no default export, so Void does not register it. Write `export default defineDurableState({ ... })` (or `defineDurableObject`). See guide/durable-state.md.",
      plain:
        "The default export of this `durable-objects/` module is not a `defineDurableState(...)` or `defineDurableObject(...)` result. Default-export the object that call returns. See guide/durable-state.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const inside = file.dir === "durable-objects";
    const governed = scanned(context, "durable-objects") !== null;
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        if (governed) checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
      CallExpression(node) {
        if (inside) return;
        for (const name of NAMES)
          if (callsImported(node, name, ["void/durable"], bindings))
            context.report({ node, messageId: "location", data: { name, path: file.path } });
      },
    };
  },
});
