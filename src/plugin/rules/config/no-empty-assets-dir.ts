import { at, configObject, isViteConfig } from "../../lib/config.ts";
import { staticString } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

/**
 * With `build.assetsDir: ""` hashed files live at the root and "the optimization is skipped"
 * (guide/edge/static-assets.md:31).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not set build.assetsDir to an empty string.",
      norms: ["edge-integrations/static-assets/1"],
      scope: "void",
    },
    messages: {
      empty:
        "`build.assetsDir` is empty, so hashed files sit at the root and Void skips the immutable cache for them. Name a directory, such as 'assets'. See guide/edge/static-assets.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isViteConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const dir = config === null ? null : at(config, "build.assetsDir");
        if (dir !== null && staticString(dir.value) === "")
          context.report({ node: dir, messageId: "empty" });
      },
    };
  },
});
