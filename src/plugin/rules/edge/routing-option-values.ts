import { staticString, unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig, keyName, literal, members } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const NOT_FOUND = ["single-page-application", "404-page", "none"];

/**
 * `routing.revalidate` is a number of seconds, globally or per path (reference/config.md:498,
 * guide/edge/revalidation.md:16); each `routing.prerender` path starts with `/`
 * (reference/config.md:530); `routing.notFound` is one of three values (:550).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give routing.revalidate, routing.prerender and routing.notFound values of the documented shape.",
      norms: [
        "reference/config/49",
        "edge-integrations/revalidation/3",
        "reference/config/51",
        "edge-integrations/frameworks-overview/9",
        "reference/config/53",
        "edge-integrations/static-assets/5",
      ],
      scope: "void",
    },
    messages: {
      revalidate:
        "`routing.revalidate{{where}}` is {{value}}, which is not a number of seconds. Write a number such as `60`, or an object of path pattern to seconds. See guide/edge/revalidation.md.",
      prerenderShape:
        "`routing.prerender` is not an array of paths. Write `['/', '/about']`. See reference/config.md.",
      prerenderPath:
        "The prerender path {{value}} does not start with `/`. Write it as an absolute path such as '/about'. See reference/config.md.",
      notFound:
        "`routing.notFound: '{{value}}'` is not a supported value. Use 'single-page-application', '404-page' or 'none'. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const revalidate = at(config, "routing.revalidate");
        if (revalidate !== null) {
          const value = unwrap(revalidate.value);
          const check = (node: typeof value, where: string) => {
            const known = literal(node);
            if (
              (known !== undefined && (typeof known.value !== "number" || known.value < 0)) ||
              node.type === "ArrayExpression"
            )
              context.report({
                node,
                messageId: "revalidate",
                data: {
                  where,
                  value: known === undefined ? "an array" : JSON.stringify(known.value),
                },
              });
          };
          if (value.type === "ObjectExpression") {
            for (const member of members(value).props) {
              const inner = unwrap(member.value);
              if (inner.type === "ObjectExpression")
                context.report({
                  node: inner,
                  messageId: "revalidate",
                  data: { where: `['${keyName(member)}']`, value: "an object" },
                });
              else check(inner, `['${keyName(member)}']`);
            }
          } else check(value, "");
        }
        const prerender = at(config, "routing.prerender");
        if (prerender !== null) {
          const value = unwrap(prerender.value);
          if (value.type === "ArrayExpression") {
            for (const element of value.elements) {
              if (element === null || element.type === "SpreadElement") continue;
              const known = unwrap(element);
              const text =
                known.type === "TemplateLiteral"
                  ? (known.quasis[0]?.value.cooked ?? "")
                  : staticString(known);
              if (known.type === "Literal" && typeof known.value !== "string")
                context.report({
                  node: element,
                  messageId: "prerenderPath",
                  data: { value: String(known.value) },
                });
              else if (text !== null && text !== "" && !text.startsWith("/"))
                context.report({
                  node: element,
                  messageId: "prerenderPath",
                  data: { value: `'${text}'` },
                });
            }
          } else if (literal(value) !== undefined || value.type === "ObjectExpression")
            context.report({ node: prerender.value, messageId: "prerenderShape" });
        }
        const notFound = at(config, "routing.notFound");
        const text = notFound === null ? null : staticString(notFound.value);
        if (notFound !== null && text !== null && !NOT_FOUND.includes(text))
          context.report({ node: notFound.value, messageId: "notFound", data: { value: text } });
      },
    };
  },
});
