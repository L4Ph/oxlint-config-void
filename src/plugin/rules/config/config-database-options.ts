import { unwrap } from "../../lib/ast.ts";
import {
  at,
  arrayAt,
  configObject,
  isVoidConfig,
  keyName,
  literal,
  members,
  stringAt,
} from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const DIALECTS = ["sqlite", "pg", "mysql"];
const CASINGS = ["snake_case", "camelCase"];

/**
 * `database` is nothing, `"pg"`, `"mysql"` or `{ dialect, casing, readReplication }`
 * (reference/config.md:133-160); `readReplication` is D1 only (:159) and a boolean
 * (guide/database/d1.md:60); the D1 binding `void db migrate --remote` uses sets
 * `migrations_dir` (reference/cli/database.md:80).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give `database` a documented value, keep readReplication to D1, and set migrations_dir on the app's D1 binding.",
      norms: [
        "reference/config/10",
        "services/database/1",
        "services/mysql/1",
        "reference/config/11",
        "services/d1/8",
        "cli/database/23",
      ],
      scope: "void",
    },
    messages: {
      database:
        "`database: '{{value}}'` is not a database Void knows. Use 'pg' or 'mysql', omit it for D1, or pass `{ dialect, casing, readReplication }`. See reference/config.md.",
      dialect:
        "`database.dialect` is '{{value}}'. Use 'sqlite', 'pg' or 'mysql'. See reference/config.md.",
      casing:
        "`database.casing` is '{{value}}'. Use 'snake_case' or 'camelCase', or omit it. See reference/config.md.",
      replicationType:
        "`database.readReplication` must be `true` or `false`. Omit it to leave the database's setting unchanged. See guide/database/d1.md.",
      replicationD1:
        "`readReplication` is for D1 only and this config uses `{{dialect}}`. Remove it, or drop the `dialect` to use D1. See reference/config.md.",
      migrationsDir:
        "The D1 binding `{{binding}}` has no `migrations_dir`, so `void db migrate --remote` cannot find its migrations. Add `migrations_dir: 'db/migrations'`. See reference/cli/database.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const database = at(config, "database");
        if (database !== null) {
          const value = unwrap(database.value);
          const known = literal(value);
          if (known !== undefined && typeof known.value === "string") {
            if (known.value !== "pg" && known.value !== "mysql")
              context.report({
                node: database.value,
                messageId: "database",
                data: { value: known.value },
              });
          } else if (value.type === "ObjectExpression") {
            const dialectProperty = at(value, "dialect");
            const dialect = dialectProperty === null ? undefined : literal(dialectProperty.value);
            if (dialectProperty !== null && dialect !== undefined) {
              if (typeof dialect.value !== "string" || !DIALECTS.includes(dialect.value))
                context.report({
                  node: dialectProperty.value,
                  messageId: "dialect",
                  data: { value: String(dialect.value) },
                });
            }
            const casingProperty = at(value, "casing");
            const casing = casingProperty === null ? undefined : literal(casingProperty.value);
            if (casingProperty !== null && casing !== undefined) {
              if (typeof casing.value !== "string" || !CASINGS.includes(casing.value))
                context.report({
                  node: casingProperty.value,
                  messageId: "casing",
                  data: { value: String(casing.value) },
                });
            }
            const replication = at(value, "readReplication");
            if (replication !== null) {
              const flag = literal(replication.value);
              if (flag !== undefined && typeof flag.value !== "boolean")
                context.report({ node: replication.value, messageId: "replicationType" });
              else if (
                dialect !== undefined &&
                (dialect.value === "pg" || dialect.value === "mysql")
              )
                context.report({
                  node: replication,
                  messageId: "replicationD1",
                  data: { dialect: dialect.value },
                });
            }
          }
        }
        const d1 = arrayAt(config, "cloudflare.d1_databases");
        if (d1 === null) return;
        const bindings = at(config, "inference.bindings.db");
        const custom = bindings === null ? undefined : literal(bindings.value);
        if (custom !== undefined && custom.value === false) return;
        const appBinding =
          custom !== undefined && typeof custom.value === "string" ? custom.value : "DB";
        if (bindings !== null && custom === undefined) return;
        for (const element of d1.elements) {
          if (element === null || element.type !== "ObjectExpression") continue;
          const { props, open } = members(element);
          if (open || props.some((member) => keyName(member) === "migrations_dir")) continue;
          if (stringAt(element, "binding") === appBinding)
            context.report({
              node: element,
              messageId: "migrationsDir",
              data: { binding: appBinding },
            });
        }
      },
    };
  },
});
