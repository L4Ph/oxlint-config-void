import { defaultExport, namedExports } from "../../lib/ast.ts";
import { isPlain, rootRelative } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";

const ENTRY = /^src\/main\.ssr\.(?:ts|tsx|js|jsx)$/;

/**
 * The custom SSR entry is `src/main.ssr.<ext>`. It default-exports `defineRender(...)` or
 * exports a named `render`. A default export that is a call, or anything that cannot be
 * followed, is accepted; only a missing renderer or a bare function is reported.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Default-export defineRender(...) (or export a named `render`) from the SSR entry.",
      norms: ["guide-core/ssr/3", "cli/generate/11"],
      scope: "void",
    },
    messages: {
      renderer:
        "`src/main.ssr` exports no renderer. Write `export default defineRender(async (c, assetTags) => { ... })`, with `defineRender` imported from `void`, or export a function named `render`. See guide/ssr.md.",
    },
    schema: [],
  },
  create(context) {
    const file = rootRelative(context);
    if (!file || !ENTRY.test(file.path)) return {};
    return {
      Program(program) {
        if (namedExports(program).has("render")) return;
        const exported = defaultExport(program);
        if (!exported || isPlain(exported.value))
          context.report({ node: exported?.node ?? program, messageId: "renderer" });
      },
    };
  },
});
