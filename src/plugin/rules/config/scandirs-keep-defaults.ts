import { statSync } from "node:fs";
import path from "node:path";
import { staticString } from "../../lib/ast.ts";
import { arrayAt, at, configObject, isVoidConfig, stringAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * The default scan directories of a native Void app (reference/resource-inference.md:41-52).
 * `src/` and `durable-objects/` are "always scanned" (:64-66), so `scanDirs` need not list them.
 */
const DEFAULTS = ["routes", "middleware", "queues", "pages", "crons", "email"];

function isDirectory(directory: string): boolean {
  try {
    return statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

/**
 * "When `inference.scanDirs` is set, it replaces the default directories entirely"
 * (reference/resource-inference.md:84, guide/live.md:28).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "When inference.scanDirs is set, list every default scan directory the app still has.",
      norms: ["reference/resource-inference/6", "services/live/6"],
      scope: "void",
    },
    messages: {
      missing:
        "`inference.scanDirs` replaces the default directories, and this app still has {{missing}} that it leaves out, so resource imports there are no longer inferred. Add them to the array. See reference/resource-inference.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    const cwd = context.cwd ?? process.cwd();
    const settings = context.settings?.void as { root?: string } | undefined;
    const root = settings?.root
      ? path.resolve(cwd, settings.root)
      : path.dirname(path.resolve(cwd, context.filename));
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        // With `sourceDir` the conventions sit under it, and a framework app has other defaults.
        if (at(config, "sourceDir") !== null) return;
        const appType = stringAt(config, "inference.appType");
        if (at(config, "inference.appType") !== null && appType !== "void") return;
        const dirs = arrayAt(config, "inference.scanDirs");
        if (dirs === null) return;
        const listed = new Set<string>();
        for (const element of dirs.elements) {
          if (element === null || element.type === "SpreadElement") return;
          const value = staticString(element);
          if (value === null) return;
          const normal = path.posix.normalize(value.replaceAll("\\", "/")).replace(/\/$/, "");
          if (normal === "." || normal === "") return;
          listed.add(normal);
        }
        const missing = DEFAULTS.filter(
          (name) => !listed.has(name) && isDirectory(path.join(root, name)),
        );
        if (missing.length > 0)
          context.report({
            node: dirs,
            messageId: "missing",
            data: { missing: missing.map((name) => `\`${name}/\``).join(", ") },
          });
      },
    };
  },
});
