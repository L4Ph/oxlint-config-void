import { namedExports } from "../../lib/ast.ts";
import { rootPath, runtimeImports } from "../../lib/frameworks.ts";
import { isTestFile } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const BINDINGS = ["void/db", "void/kv", "void/storage", "void/ai", "cloudflare:workers"];
const PAGE_FILE = /\.(?:[cm]?[jt]s|astro)$/;

/**
 * The Astro page: "Pages and API routes that access runtime bindings must opt out of
 * prerendering" with `export const prerender = false`. A file that exports `prerender` as
 * anything but the literal `true` is left alone: the value is not known here.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export `const prerender = false` from an Astro page or API route that reads runtime bindings.",
      norms: ["edge-integrations/frameworks-astro/7", "edge-integrations/frameworks-astro/12"],
      scope: "framework:astro",
    },
    messages: {
      prerender:
        "This page imports `{{module}}` to reach runtime bindings but does not opt out of prerendering, so the build would run it without them. Add `export const prerender = false;`. See integrations/frameworks/astro.md.",
    },
    schema: [],
  },
  create(context) {
    const path = rootPath(context);
    if (path === null || !path.startsWith("src/pages/") || !PAGE_FILE.test(path)) return {};
    if (isTestFile(path) || path.split("/").some((segment) => segment.startsWith("_"))) return {};
    return {
      Program(program) {
        const first = runtimeImports(program, BINDINGS)[0];
        if (!first) return;
        const exported = namedExports(program).get("prerender");
        if (exported) {
          const value = exported.init;
          const literal = value?.type === "Literal" ? value.value : undefined;
          if (literal !== true) return;
        }
        context.report({
          node: first,
          messageId: "prerender",
          data: { module: String(first.source.value) },
        });
      },
    };
  },
});
