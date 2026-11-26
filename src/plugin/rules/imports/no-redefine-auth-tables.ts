import { importBindings, staticString } from "../../lib/ast.ts";
import { readFirst, nearestPackage } from "../../lib/handlers.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const BUILDERS: Record<string, string[]> = {
  sqliteTable: ["void/schema-d1", "drizzle-orm/sqlite-core"],
  pgTable: ["void/schema-pg", "drizzle-orm/pg-core"],
  mysqlTable: ["void/schema-mysql", "drizzle-orm/mysql-core"],
};
const AUTH_TABLES = new Set(["user", "session", "account", "verification"]);
const SCHEMA_FILE = /^db\/schema(?:\.[cm]?[jt]s|\/)/;

/**
 * guide/auth.md:262: with auth on, Void creates Better Auth's tables, and "you don't need to
 * duplicate them in `db/schema.ts`". Without auth the names are the app's to use, so the rule
 * applies only where a root `auth.ts` or an `auth` entry in `void.config.*` turns auth on.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not define Better Auth's user, session, account or verification tables in db/schema.",
      norms: ["guide-core/auth/33"],
      scope: "void",
    },
    messages: {
      redefined:
        "Void already creates Better Auth's `{{table}}` table. Remove this definition and import `{{table}}Table` from `@auth-schema` to reference it. See guide/auth.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !SCHEMA_FILE.test(file.path)) return {};
    const pkg = nearestPackage(context);
    if (pkg === null) return {};
    const config = readFirst(pkg.dir, [
      "void.config.ts",
      "void.config.mts",
      "void.config.js",
      "void.config.mjs",
    ]);
    const authEnabled =
      readFirst(pkg.dir, ["auth.ts", "auth.mts", "auth.js", "auth.mjs"]) !== null ||
      (config !== null && /\bauth\b/.test(config));
    if (!authEnabled) return {};
    const builders = new Set<string>();
    return {
      Program(program) {
        for (const [local, binding] of importBindings(program))
          if (BUILDERS[binding.imported]?.includes(binding.source)) builders.add(local);
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || !builders.has(node.callee.name)) return;
        const table = node.arguments[0] ? staticString(node.arguments[0]) : null;
        if (table !== null && AUTH_TABLES.has(table))
          context.report({ node, messageId: "redefined", data: { table } });
      },
    };
  },
});
