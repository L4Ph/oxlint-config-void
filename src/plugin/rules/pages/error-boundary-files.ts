import { namedExports } from "../../lib/ast.ts";
import { defaultComponent, mentionsType } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "Boundary components don't have `.server` companions, actions, or their own `layout`
 * export" (guide/pages-routing/errors.md:119). Their props are `ErrorPageProps` (line 8).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give _error and _not-found no .server companion and no layout export, and type their props as ErrorPageProps.",
      norms: ["pages-routing/errors/11", "pages-routing/errors/12", "pages-routing/errors/2"],
      scope: "void",
    },
    messages: {
      companion:
        "`{{path}}` is a .server companion of an error boundary, and boundaries have none: Void does not read it. Delete it; load data for the error page in the layout or the component instead. See guide/pages-routing/errors.md.",
      layout:
        "A `_{{name}}` boundary cannot choose its own layout, so this `layout` export has no effect. Delete it. See guide/pages-routing/errors.md.",
      props:
        "The props of an error boundary are `ErrorPageProps` (`{ error: PageError }`). Annotate the parameter as `ErrorPageProps`, imported from your adapter (`@void/react`, `@void/vue`, `@void/svelte` or `@void/solid`). See guide/pages-routing/errors.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages") return {};
    const kind = describe(file);
    if (kind.boundary === null || kind.private || kind.test) return {};
    if (kind.serverCompanion)
      return {
        Program(node) {
          context.report({ node, messageId: "companion", data: { path: file.path } });
        },
      };
    return {
      Program(program) {
        const layout = namedExports(program).get("layout");
        if (layout)
          context.report({ node: layout.node, messageId: "layout", data: { name: kind.boundary } });
        const component = defaultComponent(program);
        const param = component?.params[0];
        // Without an annotation the file may be plain JavaScript, so only a wrong one is reported.
        const annotation = param && "typeAnnotation" in param ? param.typeAnnotation : null;
        if (param && annotation && !mentionsType(annotation, "ErrorPageProps"))
          context.report({ node: param, messageId: "props" });
      },
    };
  },
});
