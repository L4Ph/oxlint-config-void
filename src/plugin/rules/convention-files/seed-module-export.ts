import { defaultExport, namedExports, topLevelConst, unwrap } from "../../lib/ast.ts";
import { isFunctionNode, isPlain } from "../../lib/convention-files.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const SEED_FILE = /^db\/seed\.(?:ts|mts|js|mjs)$/;

/**
 * `db/seed.{ts,mts,js,mjs}` exports a default function or a named `seed` function. Only the
 * seed file itself is read, not every file that imports `defineSeed`, since a helper may
 * build seeds for it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Export a default function or a named `seed` function from db/seed.ts.",
      norms: ["reference/database/19", "services/database/12", "cli/database/15"],
      scope: "void",
    },
    messages: {
      missing:
        "`db/seed.ts` has no default function and no `seed` function, so `void db seed` has nothing to run. Write `export default defineSeed(async ({ db, schema }) => { ... })` or `export async function seed({ db, schema }) { ... }`. See guide/database.md.",
      notFunction:
        "This export of `db/seed.ts` is not a function, so `void db seed` cannot run it. Export a function (wrapped in `defineSeed(...)` if you like). See guide/database.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !SEED_FILE.test(file.path)) return {};
    return {
      Program(program) {
        const exported = defaultExport(program);
        const named = namedExports(program).get("seed");
        if (exported) {
          if (isPlain(exported.value) && !isFunctionNode(exported.value))
            context.report({ node: exported.node, messageId: "notFunction" });
          return;
        }
        if (named) {
          const init = named.init && unwrap(named.init);
          if (init && isPlain(init) && !isFunctionNode(init))
            context.report({ node: named.node, messageId: "notFunction" });
          return;
        }
        if (namedExports(program).has("default") || topLevelConst(program, "seed")) return;
        context.report({ node: program, messageId: "missing" });
      },
    };
  },
});
