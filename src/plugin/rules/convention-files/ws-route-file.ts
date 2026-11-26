import { defaultExport, importBindings } from "../../lib/ast.ts";
import { callsImported, checkDefaultExport, scanned } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const WS_FILE = /\.ws\.[cm]?[jt]sx?$/;

/**
 * A WebSocket route is a `routes/**\/*.ws.*` file that default-exports `defineRoom(...)` or
 * `defineWebSocket(...)`. A call elsewhere is reported only when it is the file's default
 * export, since that is the form of a route; a helper may call them for another file.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Write a WebSocket route as a routes/**/*.ws.* file that default-exports defineRoom(...) or defineWebSocket(...).",
      norms: ["services/websockets/4", "services/websockets/3"],
      scope: "void",
    },
    messages: {
      location:
        "`{{path}}` default-exports a WebSocket route, but Void serves those only from `routes/` files named `*.ws.ts` (or .tsx, .js, .jsx, .mts, .mjs). Rename or move it, for example to `routes/<path>.ws.ts`. See guide/websockets.md.",
      missing:
        "This WebSocket route file has no default export. Write `export default defineRoom({ ... })` (or `defineWebSocket`), imported from `void/ws`. See guide/websockets.md.",
      plain:
        "The default export of this WebSocket route is not a `defineRoom(...)` or `defineWebSocket(...)` call. Wrap it: `export default defineRoom({ ... })`, imported from `void/ws`. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const governed = scanned(context, "routes") !== null && WS_FILE.test(file.name);
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        if (governed)
          return checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
        if (file.dir === "routes" && file.segments.slice(1).some((s) => s.startsWith("_"))) return;
        const exported = defaultExport(program);
        if (
          exported &&
          ["defineRoom", "defineWebSocket"].some((name) =>
            callsImported(exported.value, name, ["void/ws"], bindings),
          )
        )
          context.report({ node: exported.node, messageId: "location", data: { path: file.path } });
      },
    };
  },
});
