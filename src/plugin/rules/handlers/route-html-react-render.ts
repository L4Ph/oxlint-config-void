import { unwrap } from "../../lib/ast.ts";
import { nearestPackage, readFirst } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const ADAPTERS = ["react", "@void/react", "solid-js", "@void/solid"];

/**
 * guide/server-routing.md:85: "In React or Solid, render JSX to HTML with the framework's
 * server renderer." The same page shows `c.html(<h1>Hello!</h1>)` for apps that configure
 * Hono's JSX, so an app that names `hono/jsx` (in the file, `vite.config.*` or
 * `tsconfig.json`) is left alone.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "In a React or Solid app, render JSX to a string before passing it to c.html().",
      norms: ["guide-core/server-routing/10"],
      scope: "void",
    },
    messages: {
      jsx: "In a React or Solid app `c.html()` takes a string, not JSX. Render it first: `c.html(renderToStaticMarkup(<Page />))` with `react-dom/server` (Solid: `renderToString` from `solid-js/web`). See guide/server-routing.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !/\.[jt]sx$/.test(file.name)) return {};
    const kind = describe(file);
    if (kind.convention !== "routes" || kind.private || kind.test) return {};
    if (context.sourceCode.text.includes("hono/jsx")) return {};
    const pkg = nearestPackage(context);
    if (pkg === null || !ADAPTERS.some((name) => pkg.dependencies.has(name))) return {};
    const config = [
      readFirst(pkg.dir, [
        "vite.config.ts",
        "vite.config.mts",
        "vite.config.js",
        "vite.config.mjs",
      ]),
      readFirst(pkg.dir, ["tsconfig.json"]),
      readFirst(pkg.dir, ["void.config.ts"]),
    ];
    if (config.some((text) => text?.includes("hono/jsx"))) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          callee.property.name !== "html"
        )
          return;
        const arg = node.arguments[0];
        if (!arg) return;
        const value = unwrap(arg);
        if (value.type === "JSXElement" || value.type === "JSXFragment")
          context.report({ node: arg, messageId: "jsx" });
      },
    };
  },
});
