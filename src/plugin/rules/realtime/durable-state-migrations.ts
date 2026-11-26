import { importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { optionsOf } from "../../lib/realtime.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Number durable state migrations 1..n in order, and set `version` to the last one.",
      norms: ["services/durable-state/7"],
      scope: "void",
    },
    messages: {
      sequence:
        "Migration {{position}} has `version: {{found}}`, but versions start at 1 and are contiguous, so it must be `{{expected}}`. See guide/durable-state.md.",
      version:
        "`version: {{found}}` does not match the last migration, which is `{{expected}}`. Set `version` to the number of the last migration. See guide/durable-state.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "durable-objects") return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!isCallOf(node, "defineDurableState", ["void/durable"], bindings)) return;
        const options = optionsOf(node);
        const list = options && property(options, "migrations")?.value;
        const migrations = list ? unwrap(list) : null;
        if (migrations?.type !== "ArrayExpression") return;
        let count = 0;
        for (const element of migrations.elements) {
          if (!element || element.type === "SpreadElement") return; // length unknown
          count += 1;
          const value = unwrap(element);
          const version =
            value.type === "ObjectExpression" ? property(value, "version")?.value : null;
          const literal = version ? unwrap(version) : null;
          if (literal?.type !== "Literal" || typeof literal.value !== "number") return;
          if (literal.value !== count) {
            context.report({
              node: literal,
              messageId: "sequence",
              data: {
                position: String(count),
                found: String(literal.value),
                expected: String(count),
              },
            });
            return;
          }
        }
        const declared = options ? property(options, "version")?.value : null;
        const top = declared ? unwrap(declared) : null;
        if (
          count > 0 &&
          top?.type === "Literal" &&
          typeof top.value === "number" &&
          top.value !== count
        )
          context.report({
            node: top,
            messageId: "version",
            data: { found: String(top.value), expected: String(count) },
          });
      },
    };
  },
});
