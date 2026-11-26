import { defineRule } from "../../rule.ts";

const DEPRECATED = new Set(["FrontmatterContext", "setFrontmatter"]);

/**
 * `useFrontmatter()` comes from `@void/md` (guide/pages-routing/markdown.md:175), and
 * "`FrontmatterContext` and `setFrontmatter()` are deprecated. Use `useFrontmatter()`"
 * (reference/api/pages.md:334). A relative import may re-export it, so only a wrong `@void/`
 * entry point is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Import useFrontmatter from '@void/md', and do not use the deprecated FrontmatterContext or setFrontmatter.",
      norms: ["pages-routing/markdown/7", "reference/pages/38"],
      scope: "void",
    },
    messages: {
      source:
        "`useFrontmatter` is exported by '@void/md', not by '{{source}}'. Write `import { useFrontmatter } from '@void/md'`. See guide/pages-routing/markdown.md.",
      deprecated:
        "`{{name}}` is deprecated. Read the page's frontmatter with `useFrontmatter()` from '@void/md'. See reference/api/pages.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);
        const isMd = source === "@void/md" || source.startsWith("@void/md/");
        if (!isMd && !source.startsWith("@void/")) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name =
            specifier.imported.type === "Identifier"
              ? specifier.imported.name
              : String(specifier.imported.value);
          if (name === "useFrontmatter" && source !== "@void/md")
            context.report({ node: specifier, messageId: "source", data: { source } });
          else if (isMd && DEPRECATED.has(name))
            context.report({ node: specifier, messageId: "deprecated", data: { name } });
        }
      },
    };
  },
});
