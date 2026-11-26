import { importBindings } from "../../lib/ast.ts";
import { callsImported } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const BUILDERS = ["sqliteTable", "pgTable", "mysqlTable"];
const SOURCES = ["void", "void/schema-d1", "void/schema-pg", "void/schema-mysql"];
const SCHEMA_FILE = /^db\/schema\.[cm]?[jt]s$/;

/**
 * Tables live in `db/schema.ts` or `db/schema/**`. Test files are not read. A
 * `db/schema.ts` is reported only when it exports nothing that could carry tables: no
 * table, no re-export, no other value export.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Define Drizzle tables in db/schema.ts or db/schema/**, and re-export a split schema from db/schema.ts.",
      norms: [
        "reference/database/2",
        "reference/structure/11",
        "services/database/2",
        "reference/structure/12",
        "services/database/5",
      ],
      scope: "void",
    },
    messages: {
      location:
        "`{{builder}}(...)` defines a table in `{{path}}`, but Void reads the schema from `db/schema.ts` and `db/schema/`. Move the table to `db/schema/<name>.ts` and re-export it from `db/schema.ts`. See guide/database.md.",
      barrel:
        "`db/schema.ts` defines no table and re-exports none, so the app has an empty schema. Define tables here, or re-export the files of `db/schema/` with `export * from './schema/users';`. See guide/database.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const inSchema = SCHEMA_FILE.test(file.path) || file.path.startsWith("db/schema/");
    const bindings = importBindings(context.sourceCode.ast);
    let tables = false;
    return {
      CallExpression(node) {
        for (const builder of BUILDERS)
          if (callsImported(node, builder, SOURCES, bindings)) {
            tables = true;
            if (!inSchema)
              context.report({ node, messageId: "location", data: { builder, path: file.path } });
          }
      },
      "Program:exit"(program) {
        if (!SCHEMA_FILE.test(file.path) || tables) return;
        const carries = program.body.some((statement) => {
          if (statement.type === "ExportAllDeclaration") return true;
          if (statement.type === "ExportDefaultDeclaration") return true;
          if (statement.type !== "ExportNamedDeclaration" || statement.exportKind === "type")
            return false;
          if (statement.source || statement.declaration?.type === "VariableDeclaration")
            return true;
          if (statement.declaration?.type === "FunctionDeclaration") return true;
          return statement.specifiers.some(
            (specifier) =>
              specifier.local.type === "Identifier" && bindings.has(specifier.local.name),
          );
        });
        if (!carries) context.report({ node: program, messageId: "barrel" });
      },
    };
  },
});
