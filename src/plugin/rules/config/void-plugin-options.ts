import { isCallOf, importBindings, property, unwrap } from "../../lib/ast.ts";
import { keyName, members } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const OPTIONS = ["persistTo", "auxiliaryWorkers"];
const WORKER_KEYS = ["configPath", "config", "viteEnvironment", "devOnly"];

/**
 * `voidPlugin()` takes `persistTo` and `auxiliaryWorkers`; each worker entry takes
 * `configPath`, `config`, `viteEnvironment` and `devOnly` (reference/api/plugin.md:10-25).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give voidPlugin() only persistTo and auxiliaryWorkers, and each auxiliary worker only configPath, config, viteEnvironment and devOnly.",
      norms: ["reference/plugin/2", "reference/plugin/3"],
      scope: "any",
    },
    messages: {
      option:
        "`voidPlugin()` has no `{{key}}` option; it takes `persistTo` and `auxiliaryWorkers`. App settings such as routing, auth and inference go in void.config.ts. See reference/api/plugin.md.",
      worker:
        "An `auxiliaryWorkers` entry has no `{{key}}` field; it takes `configPath`, `config`, `viteEnvironment` and `devOnly`. See reference/api/plugin.md.",
    },
    schema: [],
  },
  create(context) {
    let bindings: ReturnType<typeof importBindings> | undefined;
    return {
      Program(program) {
        bindings = importBindings(program);
      },
      CallExpression(node) {
        if (bindings === undefined || !isCallOf(node, "voidPlugin", ["void"], bindings)) return;
        if (node.callee.type !== "Identifier") return;
        const options = node.arguments[0] ? unwrap(node.arguments[0]) : null;
        if (options?.type !== "ObjectExpression") return;
        for (const member of members(options).props) {
          const key = keyName(member) ?? "";
          if (!OPTIONS.includes(key))
            context.report({ node: member, messageId: "option", data: { key } });
        }
        const workers = property(options, "auxiliaryWorkers");
        const list = workers === null ? null : unwrap(workers.value);
        if (list?.type !== "ArrayExpression") return;
        for (const entry of list.elements) {
          if (entry === null || entry.type === "SpreadElement") continue;
          const worker = unwrap(entry);
          if (worker.type !== "ObjectExpression") continue;
          for (const member of members(worker).props) {
            const key = keyName(member) ?? "";
            if (!WORKER_KEYS.includes(key))
              context.report({ node: member, messageId: "worker", data: { key } });
          }
        }
      },
    };
  },
});
