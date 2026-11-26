import { moduleSpecifiers, nearestPackage } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

/** `hono/cache` → `hono`; `@hono/node-server/x` → `@hono/node-server`. */
function packageName(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? "");
}

/**
 * integrations/hono.md:8 and :85: "if your app imports from `hono/*` directly, add `hono` to
 * your app's dependencies first"; "Install the package in your app, then use it directly".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Declare hono, or the @hono/* package, in the app's own package.json before importing it.",
      norms: ["edge-integrations/hono/1", "edge-integrations/hono/7"],
      scope: "any",
    },
    messages: {
      undeclared:
        "`{{name}}` is imported here but is not in this app's package.json. Void depends on Hono internally, which does not make it yours: run `npm install {{name}}`. See integrations/hono.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const specifiers = moduleSpecifiers(program).filter((node) => {
          const value = String(node.value);
          return value === "hono" || value.startsWith("hono/") || value.startsWith("@hono/");
        });
        if (specifiers.length === 0) return;
        const pkg = nearestPackage(context);
        if (pkg === null) return;
        for (const node of specifiers) {
          const name = packageName(String(node.value));
          if (!pkg.dependencies.has(name))
            context.report({ node, messageId: "undeclared", data: { name } });
        }
      },
    };
  },
});
