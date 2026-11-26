import { importBindings, property, unwrap } from "../../lib/ast.ts";
import {
  configObject,
  hasSpread,
  importedCall,
  isConfigFile,
  pluginCalls,
  stringArray,
} from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

/**
 * Analog's setup step 3 sets `resolve.mainFields` to `['module']` in the Vite config.
 * Only a config that calls `analog()` is checked.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Set resolve.mainFields to ['module'] in the Vite config of an Analog app.",
      norms: ["edge-integrations/frameworks-analog/2"],
      scope: "framework:analog",
    },
    messages: {
      missing:
        "This Vite config calls `analog()` but does not set `resolve.mainFields`. Add `resolve: { mainFields: ['module'] }`. See integrations/frameworks/analog.md.",
      wrong:
        "`resolve.mainFields` is not `['module']`, which an Analog app with Void needs. Write `mainFields: ['module']`. See integrations/frameworks/analog.md.",
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
        const analog = pluginCalls(config).some((call) =>
          importedCall(call, bindings, "default", (source) => source === "@analogjs/platform"),
        );
        if (!analog) return;
        const resolve = property(config, "resolve");
        if (!resolve) {
          if (!hasSpread(config)) context.report({ node: config, messageId: "missing" });
          return;
        }
        const options = unwrap(resolve.value);
        if (options.type !== "ObjectExpression") return;
        const fields = property(options, "mainFields");
        if (!fields) {
          if (!hasSpread(options)) context.report({ node: options, messageId: "missing" });
          return;
        }
        const list = stringArray(fields.value);
        if (list !== null && (list.length !== 1 || list[0] !== "module"))
          context.report({ node: fields.value, messageId: "wrong" });
      },
    };
  },
});
