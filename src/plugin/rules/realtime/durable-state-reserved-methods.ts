import { importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { keyName, optionsOf } from "../../lib/realtime.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const RESERVED = new Set(["fetch", "alarm", "constructor"]);

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Do not name a durable state method `fetch`, `alarm` or `constructor`.",
      norms: ["services/durable-state/6"],
      scope: "void",
    },
    messages: {
      reserved:
        "`{{name}}` is reserved and cannot be a method of a durable state. Move `fetch` and `alarm` out of `methods` to the top level of `defineDurableState({ ... })`, and rename anything else. See guide/durable-state.md.",
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
        const methods = options && property(options, "methods")?.value;
        const object = methods ? unwrap(methods) : null;
        if (object?.type !== "ObjectExpression") return;
        for (const member of object.properties) {
          if (member.type !== "Property") continue;
          const name = keyName(member);
          if (name !== null && RESERVED.has(name))
            context.report({ node: member.key, messageId: "reserved", data: { name } });
        }
      },
    };
  },
});
