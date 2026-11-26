import { property, unwrap } from "../../lib/ast.ts";
import { configObject, hasSpread, isConfigFile } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * The Nuxt page: "The top-level `alias` lets `nuxi typecheck` resolve `@schema`". The check
 * is on the key; where it points is not.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Declare a top-level '@schema' alias in nuxt.config so nuxi typecheck resolves it.",
      norms: ["edge-integrations/frameworks-nuxt/1"],
      scope: "framework:nuxt",
    },
    messages: {
      alias:
        "This Nuxt config has no top-level `alias` for `@schema`, so `nuxi typecheck` cannot resolve it in server routes. Add `alias: { '@schema': resolve(import.meta.dirname, 'db/schema.ts') }`. See integrations/frameworks/nuxt.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isConfigFile(context, "nuxt")) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (!config) return;
        const alias = property(config, "alias");
        if (!alias) {
          if (!hasSpread(config)) context.report({ node: config, messageId: "alias" });
          return;
        }
        const aliases = unwrap(alias.value);
        if (aliases.type !== "ObjectExpression" || hasSpread(aliases)) return;
        if (!property(aliases, "@schema")) context.report({ node: aliases, messageId: "alias" });
      },
    };
  },
});
