import { checkDefaultExport, scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

/**
 * Every file in `middleware/` default-exports its handler, normally `defineMiddleware(...)`
 * (which also wraps Hono middleware) or `basicAuth(...)`. Any call is accepted as the
 * default export, since only the shape is checkable from one file.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Default-export a defineMiddleware(...) handler from each file in middleware/.",
      norms: [
        "guide-core/server-routing/19",
        "reference/structure/10",
        "edge-integrations/hono/2",
        "cli/generate/10",
      ],
      scope: "void",
    },
    messages: {
      missing:
        "This file is in `middleware/`, so Void runs it on every request, but it has no default export. Write `export default defineMiddleware(async (c, next) => { await next(); })`, or rename the file to start with `_` if it is a helper. See guide/server-routing.md.",
      plain:
        "The default export of this `middleware/` file is a bare function or value. Wrap it: `export default defineMiddleware(async (c, next) => { await next(); })`. See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    if (!scanned(context, "middleware")) return {};
    return {
      Program(program) {
        checkDefaultExport(context, program, { missing: "missing", plain: "plain" });
      },
    };
  },
});
