import { importBindings } from "../../lib/ast.ts";
import { callsImported, checkDefaultExport } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * `defineAuth(...)` is read from `auth.ts` at the app's source root, which default-exports it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call defineAuth only in auth.ts at the project root, and default-export it from there.",
      norms: ["reference/auth/2", "guide-core/auth/29"],
      scope: "void",
    },
    messages: {
      location:
        "`defineAuth(...)` is called in `{{path}}`, but Void reads auth configuration only from `auth.ts` at the project root. Move the call to `auth.ts` and default-export it. See guide/auth.md.",
      missing:
        "`auth.ts` has no default export. Write `export default defineAuth(({ defaults }) => ({ ...defaults }))`. See guide/auth.md.",
      plain:
        "The default export of `auth.ts` is not a `defineAuth(...)` call. Write `export default defineAuth(({ defaults }) => ({ ...defaults }))` so Void picks up the configuration. See guide/auth.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const atRoot = file.path === "auth.ts";
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        if (atRoot) checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
      CallExpression(node) {
        if (!atRoot && callsImported(node, "defineAuth", ["void/auth"], bindings))
          context.report({ node, messageId: "location", data: { path: file.path } });
      },
    };
  },
});
