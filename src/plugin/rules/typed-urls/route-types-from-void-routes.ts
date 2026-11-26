import { defineRule } from "../../rule.ts";

const ROUTE_TYPES = new Set([
  "RouteMap",
  "RouteUrl",
  "Href",
  "RoutePath",
  "PagePath",
  "PageParams",
  "RouteOptions",
  "RouteDestination",
  "RouteUrlInput",
  "RouteQuery",
  "RoutePathMap",
  "PagePathMap",
  "RewriteDestination",
]);

/**
 * reference/api/types.md §RouteMap, §Route types: "Import these types from `void/routes`".
 * Reported only for an import from `void` or one of its other subpaths; a relative
 * module that happens to export a type of the same name is the author's own.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import RouteMap and the route types from 'void/routes'.",
      norms: ["reference/types/2"],
      scope: "void",
    },
    messages: {
      source:
        "`{{name}}` is a generated route type: import it from `void/routes`, not `{{source}}`. See reference/api/types.md (Route types).",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        if (source === "void/routes" || (source !== "void" && !source.startsWith("void/"))) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name =
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : String(specifier.imported.value);
          if (ROUTE_TYPES.has(name))
            context.report({ node: specifier, messageId: "source", data: { name, source } });
        }
      },
    };
  },
});
