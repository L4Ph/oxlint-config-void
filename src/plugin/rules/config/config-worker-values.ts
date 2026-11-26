import { unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig, keyName, literal, members } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * `worker.vars` values must be strings (reference/config.md:337); `worker.limits.cpu_ms` is
 * 1 to 300000 ms (reference/config.md:341).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Keep worker.vars values strings and worker.limits.cpu_ms between 1 and 300000.",
      norms: ["reference/config/31", "reference/config/34"],
      scope: "void",
    },
    messages: {
      varString:
        "`worker.vars.{{name}}` is not a string. Worker variables are plain text, so write the value as a string. See reference/config.md.",
      cpuMs:
        "`worker.limits.cpu_ms` is {{value}}. Use a whole number from 1 to 300000. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const vars = at(config, "worker.vars");
        const varsValue = vars === null ? null : unwrap(vars.value);
        if (varsValue?.type === "ObjectExpression") {
          for (const member of members(varsValue).props) {
            const value = unwrap(member.value);
            const text = literal(value);
            const notString =
              (text !== undefined && typeof text.value !== "string") ||
              value.type === "ObjectExpression" ||
              value.type === "ArrayExpression" ||
              value.type === "ArrowFunctionExpression" ||
              value.type === "FunctionExpression";
            if (notString)
              context.report({
                node: member.value,
                messageId: "varString",
                data: { name: keyName(member) ?? "" },
              });
          }
        }
        const cpu = at(config, "worker.limits.cpu_ms");
        const parsed = cpu === null ? undefined : literal(cpu.value);
        if (cpu === null || parsed === undefined) return;
        const number = parsed.value;
        if (
          typeof number !== "number" ||
          (Number.isInteger(number) && number >= 1 && number <= 300000)
        )
          return;
        context.report({ node: cpu.value, messageId: "cpuMs", data: { value: String(number) } });
      },
    };
  },
});
