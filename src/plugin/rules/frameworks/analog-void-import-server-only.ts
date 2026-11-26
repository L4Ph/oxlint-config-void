import { RESOURCES, rootPath, runtimeImports } from "../../lib/frameworks.ts";
import { isTestFile } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const SERVER_COMPANION = /\.server\.[cm]?[jt]sx?$/;

/**
 * The Analog page says to use `void/*` helpers "in page server loaders, actions, and API
 * routes": `*.server.ts` files and `src/server/`. Everything else under `src/app/` is
 * bundled for the browser.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In Analog, import void/db, void/kv, void/storage and void/ai only in *.server.ts files and src/server/.",
      norms: ["edge-integrations/frameworks-analog/7"],
      scope: "framework:analog",
    },
    messages: {
      browser:
        "`{{module}}` is imported in `{{path}}`, which Analog bundles for the browser. Move the call into a page's `*.server.ts` loader or action, or into an API route under `src/server/`, and pass the result to this file. See integrations/frameworks/analog.md.",
    },
    schema: [],
  },
  create(context) {
    const path = rootPath(context);
    if (path === null || !path.startsWith("src/app/")) return {};
    if (SERVER_COMPANION.test(path) || isTestFile(path)) return {};
    return {
      Program(program) {
        for (const statement of runtimeImports(program, RESOURCES))
          context.report({
            node: statement,
            messageId: "browser",
            data: { module: String(statement.source.value), path },
          });
      },
    };
  },
});
