import { moduleSpecifiers } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const DEFAULT_DIRS = [
  "routes",
  "middleware",
  "queues",
  "pages",
  "crons",
  "email",
  "src",
  "durable-objects",
];
/** Always scanned, whatever `inference.scanDirs` says (reference/resource-inference.md:70-74). */
const ALWAYS = ["src", "durable-objects"];

/**
 * reference/resource-inference.md:36 lists the directories Void scans; guide/live.md:28 says
 * "Void enables live streams when a scanned file imports `void/live`, so keep this module in
 * `src/` or another scanned directory." Only `void/live` is checked: integrations/hono.md:113
 * shows a `lib/` helper importing `void/auth`, so the other resources are not asked to sit in
 * scanned directories.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep files that import void/live in directories Void scans for resources.",
      norms: ["reference/resource-inference/4", "services/live/5"],
      scope: "any",
    },
    messages: {
      unscanned:
        "Void enables live streams only when a scanned file imports `void/live`, and `{{dir}}` is not scanned. Move this module to `src/` (or `routes/`, `pages/`, …), or add `{{dir}}` to `inference.scanDirs` together with the default directories you still use. See guide/live.md.",
    },
    schema: [
      {
        type: "object",
        properties: { scanDirs: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const settings = (context.settings?.void ?? {}) as { sourceDir?: string };
    // With `sourceDir`, Void scans that whole tree; locate() already makes paths relative to it.
    if (settings.sourceDir) return {};
    const file = locate(context);
    if (!file || describe(file).test) return {};
    const option = (context.options[0] ?? {}) as { scanDirs?: string[] };
    const scanned = [...(option.scanDirs ?? DEFAULT_DIRS), ...ALWAYS].map((dir) =>
      dir.replace(/^\.\//, "").replace(/\/$/, ""),
    );
    if (scanned.some((dir) => file.path === dir || file.path.startsWith(`${dir}/`))) return {};
    const dir = file.segments.length > 1 ? `${file.segments[0]}/` : "the project root";
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program))
          if (node.value === "void/live")
            context.report({ node, messageId: "unscanned", data: { dir } });
      },
    };
  },
});
