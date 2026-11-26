import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, property, unwrap } from "../../lib/ast.ts";
import { locate } from "../../lib/project.ts";
import { firstParam, fnOf, isWsRoute, optionsOf, walk } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

const TYPED_FILE = /\.[cm]?tsx?$/;

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Annotate room action parameters, and leave `ctx.request` and `ctx.user` out of actions.",
      norms: ["services/websockets/17", "services/websockets/18"],
      scope: "void",
    },
    messages: {
      annotate:
        "This action parameter has no type annotation, so callers see it as `never`. Write `{{name}}: <type>`. See guide/websockets.md.",
      noRequest:
        "A room action has no `ctx.{{member}}`: other server code calls it, not a client. Pass what you need as an annotated argument and authorize where you call `getRoom()`. See guide/websockets.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || !isWsRoute(file)) return {};
    const typed = TYPED_FILE.test(file.name);
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (!isCallOf(node, "defineRoom", ["void/ws"], bindings)) return;
        const options = optionsOf(node);
        const actions = options && property(options, "actions")?.value;
        const object = actions ? unwrap(actions) : null;
        if (object?.type !== "ObjectExpression") return;
        for (const member of object.properties) {
          const fn = member.type === "Property" ? fnOf(member.value) : null;
          if (!fn) continue;
          if (typed)
            for (const param of fn.params.slice(1))
              if (
                (param.type === "Identifier" ||
                  param.type === "ObjectPattern" ||
                  param.type === "ArrayPattern" ||
                  param.type === "RestElement") &&
                !param.typeAnnotation
              )
                context.report({
                  node: param,
                  messageId: "annotate",
                  data: { name: param.type === "Identifier" ? param.name : "param" },
                });
          const ctx = firstParam(fn);
          if (ctx === null) continue;
          walk(fn.body, (inner: ESTree.Node) => {
            if (
              inner.type === "MemberExpression" &&
              !inner.computed &&
              inner.object.type === "Identifier" &&
              inner.object.name === ctx &&
              inner.property.type === "Identifier" &&
              (inner.property.name === "request" || inner.property.name === "user")
            )
              context.report({
                node: inner,
                messageId: "noRequest",
                data: { member: inner.property.name },
              });
          });
        }
      },
    };
  },
});
