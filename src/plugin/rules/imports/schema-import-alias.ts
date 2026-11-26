import path from "node:path";
import { moduleSpecifiers } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const SCHEMA_PATH = /(?:^|\/)db\/schema(?:\/[^/]+)?(?:\.[cm]?[jt]s)?$/;
const APP_DIRS = new Set([
  "src",
  "routes",
  "pages",
  "middleware",
  "crons",
  "queues",
  "email",
  "durable-objects",
]);

/**
 * guide/database.md:146: "Import `db` from `void/db` and your tables from `@schema`". The
 * alias is configured by Void's Vite plugin, so it is available to the app's source, not to
 * `void.config.ts` or scripts.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import tables from the @schema alias, not by a relative path into db/schema.",
      norms: ["services/database/9"],
      scope: "void",
    },
    messages: {
      relative:
        "`{{specifier}}` reaches into `db/schema` by path. Import the tables from the alias Void configures: `import { users } from '@schema'`. See guide/database.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || describe(file).test || !APP_DIRS.has(file.segments[0] ?? "")) return {};
    const here = path.dirname(path.resolve(context.cwd ?? process.cwd(), context.filename));
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program)) {
          const specifier = String(node.value);
          if (!specifier.startsWith(".")) continue;
          const target = path.resolve(here, specifier).split(path.sep).join("/");
          if (SCHEMA_PATH.test(target))
            context.report({ node, messageId: "relative", data: { specifier } });
        }
      },
    };
  },
});
