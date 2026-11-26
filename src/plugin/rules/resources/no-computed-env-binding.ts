import { importBindings, staticString } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const DIRS = ["routes", "middleware", "pages", "queues", "crons"];

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Read bindings by static names; declare runtime-chosen keys with inference.bindings.",
      norms: ["reference/resource-inference/3"],
      scope: "void",
    },
    messages: {
      computed:
        "This reads a binding by a key chosen at runtime, which Void's scan cannot see, so the binding is not set up. Read it by name (`c.env.KV`, `c.env['KV']`, `const { KV } = c.env`), or list the key in `inference.bindings` in void.config.ts. See reference/resource-inference.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !DIRS.includes(file.dir)) return {};
    const kind = describe(file);
    if (kind.private || (file.dir === "pages" && !kind.serverCompanion)) return {};
    let imported = new Set<string>();
    return {
      Program(program) {
        imported = new Set(importBindings(program).keys());
      },
      MemberExpression(node) {
        if (
          !node.computed ||
          staticString(node.property) !== null ||
          node.property.type === "Literal"
        )
          return;
        const object = node.object;
        // shortcut: bare `env` is taken as the bindings parameter unless imported (void/env holds settings).
        const isEnv =
          (object.type === "Identifier" && object.name === "env" && !imported.has("env")) ||
          (object.type === "MemberExpression" &&
            !object.computed &&
            object.property.type === "Identifier" &&
            object.property.name === "env" &&
            object.object.type === "Identifier" &&
            object.object.name !== "process");
        if (isEnv) context.report({ node, messageId: "computed" });
      },
    };
  },
});
