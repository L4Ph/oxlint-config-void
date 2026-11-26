import { unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Use `satisfies RouteUrl[]` to check paths when `routing.typedRoutes` is enabled"
 * (guide/type-safety.md:259, reference/config.md:540).
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Annotate routing.prerender with `satisfies RouteUrl[]` when routing.typedRoutes is on.",
      norms: ["guide-core/type-safety/13", "reference/config/52"],
      scope: "void",
    },
    messages: {
      satisfies:
        "`routing.prerender` is not checked against your routes. Write `prerender: [...] satisfies RouteUrl[]` with `import type { RouteUrl } from 'void/routes'`. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const typed = at(config, "routing.typedRoutes");
        if (typed === null) return;
        const flag = unwrap(typed.value);
        if (flag.type !== "Literal" || flag.value !== true) return;
        const prerender = at(config, "routing.prerender");
        if (prerender === null) return;
        let layer = prerender.value;
        for (;;) {
          if (layer.type === "TSSatisfiesExpression") {
            if (context.sourceCode.getText(layer.typeAnnotation).includes("RouteUrl")) return;
            layer = layer.expression;
          } else if (
            layer.type === "TSAsExpression" ||
            layer.type === "TSNonNullExpression" ||
            layer.type === "ParenthesizedExpression"
          )
            layer = layer.expression;
          else break;
        }
        if (layer.type === "ArrayExpression")
          context.report({ node: layer, messageId: "satisfies" });
      },
    };
  },
});
