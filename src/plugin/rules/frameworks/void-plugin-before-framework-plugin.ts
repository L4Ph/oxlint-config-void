import { importBindings } from "../../lib/ast.ts";
import { configObject, importedCall, isConfigFile, pluginCalls } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * React Router and TanStack Start: `voidPlugin(), // must come before the framework
 * plugin`. Analog's page puts `voidPlugin()` after `analog()`, so this rule is not for it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put voidPlugin() before reactRouter() or tanstackStart() in the Vite plugins array.",
      norms: [
        "edge-integrations/frameworks-react-router/2",
        "edge-integrations/frameworks-tanstack-start/2",
      ],
      scope: "framework:react-router,tanstack-start",
    },
    messages: {
      order:
        "`voidPlugin()` comes after `{{framework}}()`. Move it in front, so the array reads `[voidPlugin(), {{framework}}(), ...]`. See integrations/frameworks/{{page}}.md.",
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
        let seen: { name: string; page: string } | null = null;
        for (const call of pluginCalls(config)) {
          if (importedCall(call, bindings, "voidPlugin", (source) => source === "void")) {
            if (seen)
              context.report({
                node: call,
                messageId: "order",
                data: { framework: seen.name, page: seen.page },
              });
          } else if (
            !seen &&
            importedCall(call, bindings, "reactRouter", (s) => s.startsWith("@react-router/dev"))
          )
            seen = { name: "reactRouter", page: "react-router" };
          else if (
            !seen &&
            importedCall(call, bindings, "tanstackStart", (s) =>
              s.startsWith("@tanstack/react-start"),
            )
          )
            seen = { name: "tanstackStart", page: "tanstack-start" };
        }
      },
    };
  },
});
