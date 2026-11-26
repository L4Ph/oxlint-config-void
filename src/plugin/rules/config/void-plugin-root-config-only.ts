import { importBindings, isCallOf } from "../../lib/ast.ts";
import { baseName } from "../../lib/config.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const ROOT_CONFIGS = /^(?:vite|nuxt|astro|svelte)\.config\.[cm]?[jt]s$/;
const OTHER_CONFIGS = /^vitest\.(?:config|workspace)\./;

/**
 * "Keep `voidPlugin()` in the **root** `vite.config.ts` only, not in the generator's own
 * config (e.g. `.vitepress/config.ts`)" (guide/app-types.md:91).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Call voidPlugin() only in the app's root vite.config.* (or its framework's root config), never in a generator's own config.",
      norms: ["guide-core/app-types/8"],
      scope: "any",
    },
    messages: {
      root: "`voidPlugin()` is called in `{{path}}`. Keep it in the root `vite.config.ts` only, and remove it from this generator's config. See guide/app-types.md.",
    },
    schema: [],
  },
  create(context) {
    const name = baseName(context.filename);
    if (isTestFile(name) || OTHER_CONFIGS.test(name)) return {};
    const settings = context.settings?.void as { sourceDir?: string } | undefined;
    const file = locate({
      filename: context.filename,
      cwd: context.cwd,
      settings: { ...context.settings, void: { ...settings, sourceDir: undefined } },
    });
    if (file === null || (file.segments.length === 1 && ROOT_CONFIGS.test(name))) return {};
    let bindings: ReturnType<typeof importBindings> | undefined;
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        if (
          bindings !== undefined &&
          node.callee.type === "Identifier" &&
          isCallOf(node, "voidPlugin", ["void"], bindings)
        )
          context.report({ node, messageId: "root", data: { path: file.path } });
      },
    };
  },
});
