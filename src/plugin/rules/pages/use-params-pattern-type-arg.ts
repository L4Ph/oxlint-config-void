import { importBindings, type ImportBinding } from "../../lib/ast.ts";
import { ADAPTER_RUNTIME, boundTo, calledIdentifier, isTypeScript } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Pass the page's pattern as the type argument, such as `useParams<'/users/[id]'>()`, to
 * type them" (reference/api/pages.md:161). Without it the result is `Record<string, string>`.
 * Only a TypeScript page is read: a `.js` or `.vue` file may be JavaScript, which has no
 * type arguments to give.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Call useParams with the page's URL pattern as the type argument.",
      norms: [
        "reference/pages/9",
        "reference/pages/16",
        "reference/pages/27",
        "reference/pages/33",
        "pages-routing/overview/22",
      ],
      scope: "void",
    },
    messages: {
      pattern:
        "`useParams()` without a type argument returns `Record<string, string>`, so a misspelled param is not an error. Pass the page's pattern: `useParams<'/users/[id]'>()`. See guide/pages-routing/overview.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages" || !isTypeScript(file.name)) return {};
    const kind = describe(file);
    if (!kind.pageComponent || kind.private || kind.layout || kind.test) return {};
    let bindings = new Map<string, ImportBinding>();
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        const name = calledIdentifier(node);
        if (
          name !== null &&
          boundTo(bindings, name, "useParams", ADAPTER_RUNTIME) &&
          !node.typeArguments
        )
          context.report({ node, messageId: "pattern" });
      },
    };
  },
});
