import { rootRelative } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

const MOVED = ["pages", "routes", "middleware", "crons", "queues", "db"];

/**
 * Only the directories and files `reference/config.md` lists as moving under `sourceDir`
 * are read. Whether the same directory also exists under `sourceDir` (the case the docs
 * call ambiguous) is not checked: every root copy is reported, which is a superset.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "With sourceDir set, keep the convention directories, auth.ts and env.ts under it, not at the project root.",
      norms: ["reference/config/5", "reference/config/6"],
      scope: "void",
    },
    messages: {
      root: "`{{path}}` is at the project root, but `sourceDir` is `{{sourceDir}}`, so Void reads it from `{{sourceDir}}/{{path}}` and does not scan both places. Move it there. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    const settings = context.settings?.void as { sourceDir?: string } | undefined;
    const sourceDir = settings?.sourceDir?.replace(/^\.\//, "").replace(/\/+$/, "");
    if (!sourceDir || sourceDir === ".") return {};
    const file = rootRelative(context);
    if (!file) return {};
    const atRoot =
      file.path === "auth.ts" ||
      file.path === "env.ts" ||
      (file.segments.length > 1 && MOVED.includes(file.dir));
    if (!atRoot) return {};
    return {
      Program(program) {
        context.report({ node: program, messageId: "root", data: { path: file.path, sourceDir } });
      },
    };
  },
});
