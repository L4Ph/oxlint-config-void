import { staticString, unwrap } from "../../lib/ast.ts";
import { configObject, isVoidConfig, keyName, members, objectAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const HEADER = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+:\s*.+$/;

/**
 * "Keys are URL patterns, values are arrays of `"Name: value"` strings", keys start with `/`,
 * and header rules ignore `Set-Cookie` and strip `"cookies"` from `Clear-Site-Data`
 * (reference/config.md:423, guide/edge/headers.md:8, :24, :41). The cookie limits are stated
 * for a Void platform; direct Cloudflare deploys apply the headers as written.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Write routing.headers as '/'-prefixed patterns mapped to arrays of 'Name: value' strings, with no Set-Cookie or cookie-clearing Clear-Site-Data.",
      norms: [
        "reference/config/44",
        "edge-integrations/headers/1",
        "edge-integrations/headers/2",
        "edge-integrations/headers/9",
      ],
      scope: "void",
    },
    messages: {
      key: "The `routing.headers` pattern '{{key}}' does not start with `/`. Write '/{{key}}'. See guide/edge/headers.md.",
      list: "The headers for '{{key}}' are not an array of strings. Write `['Name: value', ...]`. See guide/edge/headers.md.",
      entry:
        "'{{value}}' is not a `Name: value` header. Write the header name, a colon, then the value. See guide/edge/headers.md.",
      cookie:
        "A header rule cannot set a cookie: on a Void platform `Set-Cookie` is ignored here. Set the cookie in the app's response with `c.header('Set-Cookie', ...)` or the auth helpers. See guide/edge/headers.md.",
      clearSiteData:
        'On a Void platform a header rule drops `"cookies"` from `Clear-Site-Data` and ignores a rule with `"*"`. Use `"cache"` or `"storage"` here, and clear cookies in the app\'s response. See guide/edge/headers.md.',
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const headers = config === null ? null : objectAt(config, "routing.headers");
        if (headers === null) return;
        for (const member of members(headers).props) {
          const key = keyName(member) ?? "";
          if (!key.startsWith("/"))
            context.report({ node: member, messageId: "key", data: { key } });
          const list = unwrap(member.value);
          if (
            list.type === "Literal" ||
            list.type === "ObjectExpression" ||
            list.type === "TemplateLiteral"
          ) {
            context.report({ node: member.value, messageId: "list", data: { key } });
            continue;
          }
          if (list.type !== "ArrayExpression") continue;
          for (const element of list.elements) {
            if (element === null || element.type === "SpreadElement") continue;
            const value = staticString(element);
            const known = unwrap(element);
            if (value === null) {
              if (known.type === "Literal" || known.type === "ObjectExpression")
                context.report({ node: element, messageId: "entry", data: { value: "" } });
              continue;
            }
            if (!HEADER.test(value)) {
              context.report({ node: element, messageId: "entry", data: { value } });
              continue;
            }
            const name = value.slice(0, value.indexOf(":")).toLowerCase();
            if (name === "set-cookie") context.report({ node: element, messageId: "cookie" });
            else if (name === "clear-site-data" && /"cookies"|"\*"/i.test(value))
              context.report({ node: element, messageId: "clearSiteData" });
          }
        }
      },
    };
  },
});
