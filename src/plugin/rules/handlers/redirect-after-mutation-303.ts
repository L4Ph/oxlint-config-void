import { namedExports, property } from "../../lib/ast.ts";
import { importBindings } from "../../lib/ast.ts";
import { localNames, walk } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const MUTATIONS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * integrations/hono.md:126: "For a redirect after a mutation, use
 * `new HTTPException(303, { res: c.redirect('/login', 303) })` so the next request is a GET."
 * Plain `c.redirect(url)` returned from an action is documented as fine (actions-and-forms.md:31),
 * so only the thrown form is checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "A redirect thrown from an action or a POST/PUT/PATCH/DELETE route handler uses status 303.",
      norms: ["edge-integrations/hono/10"],
      scope: "void",
    },
    messages: {
      status:
        "A redirect thrown after a mutation uses 303 so the next request is a GET, not {{status}}: `throw new HTTPException(303, { res: c.redirect(url, 303) })`. See integrations/hono.md.",
      resStatus:
        "Pass 303 to `c.redirect` here too, so the response carries it: `c.redirect(url, 303)`. See integrations/hono.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    const roots: string[] = [];
    if (kind.serverCompanion && !kind.test) roots.push("action", "actions");
    else if (kind.convention === "routes" && !kind.private && !kind.test) roots.push(...MUTATIONS);
    if (roots.length === 0) return {};
    return {
      Program(program) {
        const names = localNames(importBindings(program), "HTTPException", [
          "hono/http-exception",
          "hono",
        ]);
        if (names.size === 0) return;
        const exports = namedExports(program);
        for (const name of roots) {
          const found = exports.get(name);
          if (!found) continue;
          walk(found.init ?? found.node, (node) => {
            if (
              node.type !== "NewExpression" ||
              node.callee.type !== "Identifier" ||
              !names.has(node.callee.name)
            )
              return;
            const first = node.arguments[0];
            if (first?.type !== "Literal" || typeof first.value !== "number") return;
            if (first.value < 300 || first.value > 399) return;
            if (first.value !== 303)
              context.report({
                node: first,
                messageId: "status",
                data: { status: String(first.value) },
              });
            const options = node.arguments[1];
            const res = options ? property(options, "res") : null;
            const call = res?.value;
            if (
              call?.type === "CallExpression" &&
              call.callee.type === "MemberExpression" &&
              !call.callee.computed &&
              call.callee.property.type === "Identifier" &&
              call.callee.property.name === "redirect"
            ) {
              const status = call.arguments[1];
              if (
                !status ||
                (status.type === "Literal" &&
                  typeof status.value === "number" &&
                  status.value !== 303)
              )
                context.report({ node: call, messageId: "resStatus" });
            }
          });
        }
      },
    };
  },
});
