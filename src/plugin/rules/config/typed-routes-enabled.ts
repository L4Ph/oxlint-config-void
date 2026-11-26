import { unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig, members } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Enable `routing.typedRoutes` to catch misspelled URLs" (guide/type-safety.md:273); `void init`
 * turns it on for new apps (reference/cli/setup.md:36).
 */
export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Set routing.typedRoutes: true in void.config.ts.",
      norms: ["guide-core/type-safety/14", "pages-routing/overview/17", "cli/setup/6"],
      scope: "void",
    },
    messages: {
      typedRoutes:
        "`routing.typedRoutes` is not on, so a misspelled URL in a link, redirect or rewrite passes type checking. Add `routing: { typedRoutes: true }`. See guide/type-safety.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null || members(config).open) return;
        const routing = at(config, "routing");
        if (routing === null) {
          context.report({ node: config, messageId: "typedRoutes" });
          return;
        }
        const value = unwrap(routing.value);
        if (value.type !== "ObjectExpression" || members(value).open) return;
        const typed = at(value, "typedRoutes");
        if (typed === null) {
          context.report({ node: routing, messageId: "typedRoutes" });
          return;
        }
        const flag = unwrap(typed.value);
        if (flag.type === "Literal" && flag.value === false)
          context.report({ node: typed, messageId: "typedRoutes" });
      },
    };
  },
});
