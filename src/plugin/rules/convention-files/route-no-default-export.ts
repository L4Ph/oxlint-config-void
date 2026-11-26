import { namedExports } from "../../lib/ast.ts";
import { scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

const LOWERCASE = ["get", "post", "put", "patch", "delete", "head", "options", "handler"];

/** A route file exports handlers by the HTTP method's upper-case name, never as `default`. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export route handlers as named HTTP-method constants (GET, POST, ...), not as a default export.",
      norms: ["reference/structure/1", "guide-core/server-routing/8"],
      scope: "void",
    },
    messages: {
      default:
        "A route file exports one handler per HTTP method by name, so a default export answers no request. Write `export const GET = defineHandler(...)` (or POST, PUT, ...). See guide/server-routing.md.",
      lowercase:
        "`{{name}}` is not an HTTP-method export: Void looks for the upper-case name. Rename it to `{{upper}}`. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = scanned(context, "routes");
    if (!file || /\.ws\.[^.]+$/.test(file.name) || file.segments.some((s) => s.startsWith(".")))
      return {};
    return {
      Program(program) {
        for (const statement of program.body)
          if (statement.type === "ExportDefaultDeclaration")
            context.report({ node: statement, messageId: "default" });
        for (const [name, { node }] of namedExports(program))
          if (name === "default" && node.type === "ExportSpecifier")
            context.report({ node, messageId: "default" });
          else if (LOWERCASE.includes(name))
            context.report({
              node,
              messageId: "lowercase",
              data: { name, upper: name === "handler" ? "GET (or POST, ...)" : name.toUpperCase() },
            });
      },
    };
  },
});
