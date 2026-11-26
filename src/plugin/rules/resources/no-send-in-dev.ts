import { defineRule } from "../../rule.ts";

/** `sendInDev` is the deprecated switch that sent real mail from the dev server. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Remove the deprecated `sendInDev` option so the dev server uses the local inbox.",
      norms: ["services/sending/30"],
      scope: "any",
    },
    messages: {
      removed:
        "`sendInDev` is deprecated. Remove it: in development, sends go to the local inbox, and a deployed app sends real mail. See guide/email/sending.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      ObjectExpression(node) {
        for (const member of node.properties) {
          if (member.type !== "Property" || member.computed) continue;
          const key = member.key;
          if (
            (key.type === "Identifier" && key.name === "sendInDev") ||
            (key.type === "Literal" && key.value === "sendInDev")
          )
            context.report({ node: member, messageId: "removed" });
        }
      },
    };
  },
});
