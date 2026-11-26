import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings } from "../../lib/ast.ts";
import { boundTo, calledIdentifier, defaultComponent, isJsx } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * A React page reads a deferred prop with `use()` under a `<Suspense>` boundary, and leaves
 * a rejection to an error boundary (guide/pages-routing/loaders.md, reference/api/pages.md).
 * Syntax cannot tell a deferred prop from another promise, so the Suspense check looks only
 * at `use(prop)` in the page component itself, and the try/catch check at any `use()`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Read a deferred prop with use() under a <Suspense> boundary, and handle a rejection with an error boundary, not try/catch.",
      norms: ["reference/pages/19", "reference/pages/20", "pages-routing/loaders/12"],
      scope: "void",
    },
    messages: {
      noSuspense:
        "`use({{name}})` reads a deferred prop, and this file renders no `<Suspense>`. Wrap the part of the page that reads it in `<Suspense fallback={...}>`. See guide/pages-routing/loaders.md.",
      tryCatch:
        "`use()` inside `try` swallows the promise React throws while the value is pending, and a rejection is meant for an error boundary. Remove the try/catch and put an error boundary around the `<Suspense>`. See guide/pages-routing/loaders.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages" || !isJsx(file.name)) return {};
    const kind = describe(file);
    if (kind.test || kind.island) return {};
    let bindings: ReturnType<typeof importBindings> = new Map();
    const tries: [number, number][] = [];
    const uses: ESTree.CallExpression[] = [];
    let suspense = false;
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      TryStatement(node) {
        tries.push(node.block.range);
      },
      JSXOpeningElement(node) {
        const name = node.name;
        if (
          (name.type === "JSXIdentifier" && name.name === "Suspense") ||
          (name.type === "JSXMemberExpression" && name.property.name === "Suspense")
        )
          suspense = true;
      },
      CallExpression(node) {
        const name = calledIdentifier(node);
        if (name !== null && boundTo(bindings, name, "use", ["react"])) uses.push(node);
      },
      "Program:exit"(program) {
        for (const call of uses) {
          if (tries.some(([start, end]) => start <= call.range[0] && call.range[1] <= end))
            context.report({ node: call, messageId: "tryCatch" });
        }
        if (suspense || kind.private || kind.layout || !kind.pageComponent) return;
        const component = defaultComponent(program);
        const first = component?.params[0];
        if (!component || !first) return;
        const props = new Set<string>();
        let holder: string | null = null;
        if (first.type === "ObjectPattern") {
          for (const member of first.properties)
            if (member.type === "Property" && member.value.type === "Identifier")
              props.add(member.value.name);
        } else if (first.type === "Identifier") holder = first.name;
        for (const call of uses) {
          if (call.range[0] < component.range[0] || call.range[1] > component.range[1]) continue;
          const arg = call.arguments[0];
          if (arg === undefined) continue;
          const name =
            arg.type === "Identifier" && props.has(arg.name)
              ? arg.name
              : arg.type === "MemberExpression" &&
                  holder !== null &&
                  arg.object.type === "Identifier" &&
                  arg.object.name === holder &&
                  !arg.computed &&
                  arg.property.type === "Identifier"
                ? `${holder}.${arg.property.name}`
                : null;
          if (name !== null)
            context.report({ node: call, messageId: "noSuspense", data: { name } });
        }
      },
    };
  },
});
