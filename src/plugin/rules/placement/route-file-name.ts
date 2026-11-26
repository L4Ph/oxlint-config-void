import { describe, isTestFile, locate } from "../../lib/project.ts";
import { scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

const ROUTE_EXTENSION = /\.(?:ts|tsx|js|jsx|mts|mjs)$/;
const DECLARATION = /\.d\.[cm]?ts$/;

/** A path segment without its extension and without the `.server`, `.ws`, `.island`, `.dev`, `.prod` markers. */
function stem(segment: string): string {
  let current = segment.replace(/\.[^.]+$/, "");
  for (;;) {
    const next = current.replace(/\.(?:server|ws|island|dev|prod)$/, "");
    if (next === current) return current;
    current = next;
  }
}

function wrongSegment(segment: string): boolean {
  return (
    segment === "*" ||
    /[:{}]/.test(segment) ||
    segment.startsWith("$") ||
    /^\[[^\]]*\.\.\.\]$/.test(segment) ||
    segment.startsWith("[*")
  );
}

/**
 * Route files are named by Void's rules: a script extension and `[id]` / `[...slug]` for
 * dynamic segments. "Use `.tsx` or `.jsx` when the file holds JSX" is not checked: the linter
 * cannot parse JSX in a `.ts`/`.js`/`.mts`/`.mjs` file, so it reports a parse error and no
 * rule runs. A `$`-prefixed segment is
 * reported although nothing in the docs says a literal `$` is never meant.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Name route files with a script extension and write dynamic segments as [id] and [...name].",
      norms: [
        "guide-core/server-routing/1",
        "guide-core/server-routing/9",
        "reference/structure/2",
        "services/websockets/5",
        "guide-core/server-routing/2",
        "reference/structure/3",
        "reference/structure/4",
      ],
      scope: "void",
    },
    messages: {
      extension:
        "`{{name}}` is in `routes/` with an extension Void does not read there. Name it with `.ts`, `.tsx`, `.js`, `.jsx`, `.mts` or `.mjs`, or start the name with `_` if it is not a route. See guide/server-routing.md.",
      segment:
        "`{{segment}}` is not how Void names a dynamic segment. Write `[id]` for a parameter and `[...slug]` for a catch-all, in the file or directory name. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || (file.dir !== "routes" && file.dir !== "pages")) return {};
    if (isTestFile(file.name) || DECLARATION.test(file.name) || describe(file).private) return {};
    const inRoutes =
      scanned(context, "routes") !== null && !file.segments.some((s) => s.startsWith("."));
    return {
      Program(program) {
        if (inRoutes && !ROUTE_EXTENSION.test(file.name))
          return context.report({
            node: program,
            messageId: "extension",
            data: { name: file.name },
          });
        const segments = file.segments.slice(1);
        const bad = segments
          .map((segment, index) => (index === segments.length - 1 ? stem(segment) : segment))
          .find(wrongSegment);
        if (bad !== undefined)
          context.report({ node: program, messageId: "segment", data: { segment: bad } });
      },
    };
  },
});
