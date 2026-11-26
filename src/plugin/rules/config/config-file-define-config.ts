import { defaultExport, importBindings, unwrap } from "../../lib/ast.ts";
import { isVoidConfig } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/**
 * `void.config.ts` default-exports `defineConfig(...)` imported from `void/config`
 * (reference/config.md:12, reference/api/plugin.md:29).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Default-export defineConfig(...) imported from 'void/config' in void.config.ts.",
      norms: ["reference/config/1", "reference/plugin/4"],
      scope: "void",
    },
    messages: {
      wrongImport:
        "`defineConfig` is imported from '{{source}}'. In void.config.ts import it from 'void/config'. See reference/config.md.",
      notDefined:
        "This default export is a plain object. Wrap it: `export default defineConfig({ ... })` with `import { defineConfig } from 'void/config'`. See reference/config.md.",
      noDefault:
        "void.config.ts has no default export. Write `export default defineConfig({ ... })` with `import { defineConfig } from 'void/config'`. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        for (const binding of importBindings(program).values())
          if (
            binding.imported === "defineConfig" &&
            !binding.typeOnly &&
            binding.source !== "void/config"
          )
            context.report({
              node: binding.node,
              messageId: "wrongImport",
              data: { source: binding.source },
            });
        const exported = defaultExport(program);
        if (exported === null) {
          const commonJs = program.body.some(
            (statement) =>
              statement.type === "ExpressionStatement" &&
              statement.expression.type === "AssignmentExpression" &&
              statement.expression.left.type === "MemberExpression" &&
              statement.expression.left.object.type === "Identifier" &&
              statement.expression.left.object.name === "module",
          );
          if (!commonJs) context.report({ node: program, messageId: "noDefault" });
          return;
        }
        if (unwrap(exported.value).type === "ObjectExpression")
          context.report({ node: exported.node, messageId: "notDefined" });
      },
    };
  },
});
