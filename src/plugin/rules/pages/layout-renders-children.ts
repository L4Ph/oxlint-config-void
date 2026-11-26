import { defaultComponent, isJsx } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * "When a page renders, the layout wraps it. The page component is injected as the layout's
 * children" (guide/pages-routing/layouts.md:146). Only `.tsx` / `.jsx` layouts are read:
 * oxlint does not see the template of a `.vue` or `.svelte` file, where `<slot />` lives.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "A layout component renders its children.",
      norms: ["pages-routing/layouts/2"],
      scope: "void",
    },
    messages: {
      children:
        "This layout never uses `children`, so the page it wraps is not rendered. Take `children` from the props and render it: `<main>{children}</main>` (React) or `{props.children}` (Solid). See guide/pages-routing/layouts.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages" || !isJsx(file.name)) return {};
    const kind = describe(file);
    if (!kind.layout || kind.serverCompanion || kind.test || kind.private) return {};
    return {
      Program(program) {
        const component = defaultComponent(program);
        if (!component) return;
        if (!/\bchildren\b|<slot\b/.test(context.sourceCode.text))
          context.report({ node: component, messageId: "children" });
      },
    };
  },
});
