import { RESOURCES, rootPath, runtimeImports } from "../../lib/frameworks.ts";
import { isTestFile } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const CLIENT_DIRS = ["components", "pages", "composables", "layouts"];

/**
 * The Nuxt page says to use Void's helpers "in server routes, API handlers, and
 * middleware" and `void/kv`, `void/storage` and `void/ai` "from server-side code".
 * Components, pages, composables, layouts, everything under Nuxt 4's `app/`, and every
 * `.vue` file outside `server/` are browser code. `void/sandbox` is left out: the Nuxt
 * page does not mention it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In Nuxt, import void/db, void/kv, void/storage and void/ai in server/ only, not in components, pages or composables.",
      norms: ["edge-integrations/frameworks-nuxt/12"],
      scope: "framework:nuxt",
    },
    messages: {
      client:
        "`{{module}}` is imported in `{{path}}`, which Nuxt bundles for the browser. Read the data in a server route under `server/` and fetch it here. See integrations/frameworks/nuxt.md.",
    },
    schema: [],
  },
  create(context) {
    const path = rootPath(context);
    if (path === null || path.startsWith("server/") || isTestFile(path)) return {};
    if (/\.server\.[^/]+$/.test(path)) return {};
    const inside = path.startsWith("app/") ? path.slice("app/".length) : path;
    const browser =
      path.startsWith("app/") ||
      path.endsWith(".vue") ||
      CLIENT_DIRS.includes(inside.split("/")[0] ?? "");
    if (!browser) return {};
    return {
      Program(program) {
        for (const statement of runtimeImports(program, RESOURCES))
          context.report({
            node: statement,
            messageId: "client",
            data: { module: String(statement.source.value), path },
          });
      },
    };
  },
});
