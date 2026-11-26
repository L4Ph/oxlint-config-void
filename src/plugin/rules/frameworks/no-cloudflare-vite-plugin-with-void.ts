import { importBindings } from "../../lib/ast.ts";
import { configObject, importedCall, isConfigFile, pluginCalls } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * React Router and TanStack Start: "You don't need a separate Cloudflare adapter", because
 * the overview says both use the Cloudflare Vite plugin that Void provides.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not add @cloudflare/vite-plugin to a React Router or TanStack Start config that uses voidPlugin().",
      norms: [
        "edge-integrations/frameworks-react-router/1",
        "edge-integrations/frameworks-tanstack-start/1",
      ],
      scope: "framework:react-router,tanstack-start",
    },
    messages: {
      adapter:
        "`@cloudflare/vite-plugin` is imported next to `voidPlugin()`, which already provides the Cloudflare Vite plugin. Remove this import and the plugin call. See integrations/frameworks/react-router.md and tanstack-start.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isConfigFile(context, "vite")) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (!config) return;
        const bindings = importBindings(program);
        if (
          !pluginCalls(config).some((call) =>
            importedCall(call, bindings, "voidPlugin", (s) => s === "void"),
          )
        )
          return;
        for (const statement of program.body)
          if (
            statement.type === "ImportDeclaration" &&
            statement.importKind !== "type" &&
            statement.source.value === "@cloudflare/vite-plugin"
          )
            context.report({ node: statement, messageId: "adapter" });
      },
    };
  },
});
