import { importBindings } from "../../lib/ast.ts";
import { callsImported, checkDefaultExport } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/** `env.ts` at the app's source root default-exports `defineEnv(...)`, and nothing else calls it. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Declare the env schema with defineEnv in env.ts at the project root, default-exported.",
      norms: ["reference/env/1", "guide-core/env-vars/2"],
      scope: "void",
    },
    messages: {
      location:
        "`defineEnv(...)` is called in `{{path}}`, but Void reads the env schema only from `env.ts` at the project root. Move the call to `env.ts` and default-export it. See guide/env-vars.md.",
      missing:
        "`env.ts` has no default export. Write `export default defineEnv({ ... })` so Void can discover the schema. See guide/env-vars.md.",
      plain:
        "The default export of `env.ts` is not a `defineEnv(...)` call. Write `export default defineEnv({ ... })`. See guide/env-vars.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const atRoot = file.path === "env.ts";
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        if (atRoot) checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
      CallExpression(node) {
        if (!atRoot && callsImported(node, "defineEnv", ["void/env"], bindings))
          context.report({ node, messageId: "location", data: { path: file.path } });
      },
    };
  },
});
