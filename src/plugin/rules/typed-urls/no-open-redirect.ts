import type { Context, ESTree } from "vite-plus/lint/plugins";
import { calleeName } from "../../lib/ast.ts";
import { initOf, strip, variableOf } from "../../lib/forms-actions.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const REQUEST_VALUE = /^c\.req\.(?:query|header|param)$/;

/** `c.req.query(...)` and friends, also on the left of `??` / `||`. */
function isRequestValue(context: Context, node: ESTree.Node): boolean {
  const value = strip(node);
  if (value.type === "Identifier") {
    // A `const` read nowhere else: nothing between the request and the redirect checks it.
    const init = initOf(context, value);
    const reads = variableOf(context, value)?.references.filter((r) => !r.init) ?? [];
    return init !== null && reads.length === 1 && isRequestValue(context, init);
  }
  if (value.type === "CallExpression") {
    const name = calleeName(value);
    return name !== null && REQUEST_VALUE.test(name);
  }
  if (value.type === "LogicalExpression" && value.operator !== "&&")
    return isRequestValue(context, value.left) || isRequestValue(context, value.right);
  return false;
}

/**
 * reference/api/rewrites.md §c.rewrite(destination): "A cast skips the type check; Void
 * doesn't validate redirect destinations at runtime. For request values such as
 * `?redirectTo=`, check the origin before redirecting." Reported: the request value
 * (`c.req.query|header|param(...)`, casts and `??` fallbacks allowed) handed straight to
 * `c.redirect` / `c.rewrite`, or through a variable that is used nowhere else.
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Check a request-supplied redirect target before c.redirect or c.rewrite.",
      norms: ["reference/rewrites/4", "guide-core/type-safety/20"],
      scope: "void",
    },
    messages: {
      open: "`{{call}}` receives a value from the request without a check, and a cast does not validate it. Compare its origin first: `new URL(value, c.req.url).origin === new URL(c.req.url).origin`, else redirect to a fixed path. See reference/api/rewrites.md (c.rewrite).",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (
      kind.test ||
      !(kind.serverCompanion || kind.convention === "routes" || kind.convention === "middleware")
    )
      return {};
    return {
      CallExpression(node) {
        const name = calleeName(node);
        if ((name !== "c.redirect" && name !== "c.rewrite") || !node.arguments[0]) return;
        if (isRequestValue(context, node.arguments[0]))
          context.report({ node: node.arguments[0], messageId: "open", data: { call: name } });
      },
    };
  },
});
