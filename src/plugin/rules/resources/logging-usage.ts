import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, staticString } from "../../lib/ast.ts";
import { ancestors } from "../../lib/resources.ts";
import { defineRule } from "../../rule.ts";

const METHODS = new Set(["error", "warn", "info", "child"]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Use only logger.error/warn/info/child, and log errors as the Error object.",
      norms: ["reference/resources/6", "cli/project/11"],
      scope: "void",
    },
    messages: {
      method:
        "`logger.{{name}}` does not exist. The logger from 'void/log' has `error`, `warn`, `info` and `child`. See reference/api/resources.md.",
      messageOnly:
        "Only `{{param}}.message` is logged, so the log shows no stack. Pass the error itself: `{{call}}('Save failed:', {{param}})`. See reference/cli/project.md.",
    },
    schema: [],
  },
  create(context) {
    let loggerNames = new Set<string>();
    return {
      Program(program) {
        loggerNames = new Set(
          [...importBindings(program)]
            .filter(([, b]) => b.source === "void/log" && b.imported === "logger")
            .map(([name]) => name),
        );
      },
      MemberExpression(node) {
        if (
          node.computed ||
          node.object.type !== "Identifier" ||
          node.property.type !== "Identifier"
        )
          return;
        if (loggerNames.has(node.object.name) && !METHODS.has(node.property.name))
          context.report({
            node: node.property,
            messageId: "method",
            data: { name: node.property.name },
          });
      },
      CallExpression(node) {
        const name = calleeName(node);
        const root = name?.split(".")[0] ?? "";
        if (name !== "console.error" && !(name === `${root}.error` && loggerNames.has(root)))
          return;
        const catchClause = ancestors(node).find((a) => a.type === "CatchClause");
        if (catchClause?.type !== "CatchClause" || catchClause.param?.type !== "Identifier") return;
        const param = catchClause.param.name;
        const rest = node.arguments.filter(
          (arg) =>
            arg.type !== "SpreadElement" && staticString(arg) === null && arg.type !== "Literal",
        );
        const onlyMessage = (arg: ESTree.Node) =>
          arg.type === "MemberExpression" &&
          !arg.computed &&
          arg.object.type === "Identifier" &&
          arg.object.name === param &&
          arg.property.type === "Identifier" &&
          arg.property.name === "message";
        if (rest.length > 0 && rest.every(onlyMessage))
          context.report({ node, messageId: "messageOnly", data: { param, call: name } });
      },
    };
  },
});
