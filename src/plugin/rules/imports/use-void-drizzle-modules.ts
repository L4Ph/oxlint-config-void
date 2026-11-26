import { moduleSpecifiers } from "../../lib/handlers.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const CORES: Record<string, string> = {
  "drizzle-orm/sqlite-core": "void/schema-d1",
  "drizzle-orm/pg-core": "void/schema-pg",
  "drizzle-orm/mysql-core": "void/schema-mysql",
};
const VALIDATORS: Record<string, string> = {
  "drizzle-zod": "void/drizzle-zod",
  "drizzle-valibot": "void/drizzle-valibot",
  "drizzle-arktype": "void/drizzle-arktype",
};
const DRIVERS = new Set([
  "drizzle-orm/d1",
  "drizzle-orm/node-postgres",
  "drizzle-orm/postgres-js",
  "drizzle-orm/mysql2",
]);
/** The operators and types `void/db` re-exports (reference/api/database.md:108-116). */
const FROM_VOID_DB = new Set(
  "sql eq ne gt gte lt lte and or not desc asc like ilike notLike inArray notInArray isNull isNotNull between notBetween exists notExists count sum avg min max SQL SQLWrapper AnyColumn BatchItem".split(
    " ",
  ),
);

/**
 * guide/database.md:55,102,146 and reference/api/database.md:108-116: Void re-exports the
 * schema builders (`void/schema-d1|pg|mysql`), the query operators and types (`void/db`) and
 * the validators (`void/drizzle-zod|valibot|arktype`), "so you never need to depend on
 * `drizzle-orm` directly". Migration and seed scripts under `db/` are left alone.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Import Drizzle schema builders, query operators, types, validators and the db instance from Void's modules, not from drizzle-orm packages.",
      norms: [
        "guide-core/auth/16",
        "reference/config/13",
        "services/database/3",
        "services/database/4",
        "services/postgresql/5",
        "reference/database/16",
        "reference/database/17",
        "services/database/8",
        "reference/database/1",
        "services/database/14",
      ],
      scope: "void",
    },
    messages: {
      schema:
        "Void re-exports `{{source}}`: import the table and column builders from `{{use}}`. See guide/database.md.",
      operators:
        "Void re-exports the query operators and types: import {{names}} from `void/db` instead of `drizzle-orm`. See reference/api/database.md.",
      driver:
        "Get the database from `void/db` (`import { db } from 'void/db'`, or `createDb` for another binding) instead of creating one with `{{source}}`. See reference/api/database.md.",
      validator: "Void re-exports `{{source}}`: import it from `{{use}}`. See guide/database.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (file?.dir === "db" && !/^db\/schema(?:\.|\/)/.test(file.path)) return {};
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program)) {
          const source = String(node.value);
          if (source in CORES)
            context.report({
              node,
              messageId: "schema",
              data: { source, use: CORES[source] ?? "" },
            });
          else if (source in VALIDATORS)
            context.report({
              node,
              messageId: "validator",
              data: { source, use: VALIDATORS[source] ?? "" },
            });
          else if (DRIVERS.has(source))
            context.report({ node, messageId: "driver", data: { source } });
        }
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration" || statement.source.value !== "drizzle-orm")
            continue;
          const names = statement.specifiers.flatMap((specifier) =>
            specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier"
              ? [specifier.imported.name]
              : [],
          );
          const covered = names.filter((name) => FROM_VOID_DB.has(name));
          if (covered.length > 0)
            context.report({
              node: statement.source,
              messageId: "operators",
              data: { names: covered.map((name) => `\`${name}\``).join(", ") },
            });
        }
      },
    };
  },
});
