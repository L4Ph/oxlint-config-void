import { importBindings } from "../../lib/ast.ts";
import { destinationOf } from "../../lib/typed-urls.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/type-safety.md §Checked URL strings: "For a URL from a provider SDK, your CMS, or
 * `public/`, use `as Href` to skip the type check". A cast to `any` or `string` in the
 * same place skips it without saying what the string is.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Cast a URL TypeScript cannot check with `as Href`, not `as any` or `as string`.",
      norms: ["guide-core/type-safety/19"],
      scope: "void",
    },
    messages: {
      cast: "`as {{type}}` hides what this URL is. Cast a URL you trust with `as Href` (`import type { Href } from 'void/routes'`). See guide/type-safety.md (Typed URLs and Navigation).",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || describe(file).test) return {};
    const bindings = importBindings(context.sourceCode.ast);
    function check(node: Parameters<typeof destinationOf>[1]) {
      const value = destinationOf(context, node, bindings)?.value;
      if (value?.type !== "TSAsExpression") return;
      const type = value.typeAnnotation.type;
      if (type === "TSAnyKeyword" || type === "TSStringKeyword")
        context.report({
          node: value,
          messageId: "cast",
          data: { type: type === "TSAnyKeyword" ? "any" : "string" },
        });
    }
    return { JSXAttribute: check, CallExpression: check };
  },
});
