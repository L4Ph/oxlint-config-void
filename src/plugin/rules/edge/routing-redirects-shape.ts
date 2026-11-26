import { staticString, unwrap } from "../../lib/ast.ts";
import {
  configObject,
  isVoidConfig,
  keyName,
  literal,
  members,
  at,
  objectAt,
} from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const STATUSES = [301, 302, 303, 307, 308];

/**
 * Redirect sources start with `/` or `https://host`, `:splat` pairs with `*`, and a status is
 * one of five (guide/edge/redirects.md:23-25, :54; reference/config.md:438).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Write routing.redirects sources starting with '/' or https://host, :splat only with a * source, and a status Void supports.",
      norms: [
        "edge-integrations/redirects/1",
        "edge-integrations/redirects/9",
        "edge-integrations/redirects/3",
        "reference/config/45",
        "edge-integrations/redirects/2",
      ],
      scope: "void",
    },
    messages: {
      source:
        "The redirect source '{{key}}' does not start with `/`. Write a path such as '/old', or `https://host/path` to redirect one domain. See guide/edge/redirects.md.",
      insecure:
        "The redirect source '{{key}}' uses `http://`. A domain-level source must use `https://`. See guide/edge/redirects.md.",
      host: "The redirect source '{{key}}' has a wildcard or a port in its host. Use a literal hostname such as `https://www.example.com/*`. See guide/edge/redirects.md.",
      splat:
        "The destination '{{to}}' uses `:splat`, but the source '{{key}}' has no `*` to capture. Add `*` to the source, or remove `:splat`. See guide/edge/redirects.md.",
      missingTo:
        "The redirect for '{{key}}' is an object without `to`. Write `{ to: '/destination', status: 301 }`. See reference/config.md.",
      status:
        "The redirect status {{status}} is not supported. Use 301, 302, 303, 307 or 308. See guide/edge/redirects.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const redirects = config === null ? null : objectAt(config, "routing.redirects");
        if (redirects === null) return;
        for (const member of members(redirects).props) {
          const key = keyName(member) ?? "";
          if (key.startsWith("http://"))
            context.report({ node: member, messageId: "insecure", data: { key } });
          else if (key.startsWith("https://")) {
            const host = key.slice("https://".length).split("/")[0] ?? "";
            if (/[*:]/.test(host))
              context.report({ node: member, messageId: "host", data: { key } });
          } else if (!key.startsWith("/"))
            context.report({ node: member, messageId: "source", data: { key } });
          const value = unwrap(member.value);
          let destination: string | null = staticString(value);
          let destinationNode = member.value;
          if (value.type === "ObjectExpression") {
            const to = at(value, "to");
            const { open } = members(value);
            if (to === null && !open)
              context.report({ node: value, messageId: "missingTo", data: { key } });
            destination = to === null ? null : staticString(to.value);
            destinationNode = to?.value ?? member.value;
            const status = at(value, "status");
            const known = status === null ? undefined : literal(status.value);
            if (
              status !== null &&
              known !== undefined &&
              (typeof known.value !== "number" || !STATUSES.includes(known.value))
            )
              context.report({
                node: status.value,
                messageId: "status",
                data: { status: JSON.stringify(known.value) },
              });
          }
          if (destination?.includes(":splat") && !key.includes("*"))
            context.report({
              node: destinationNode,
              messageId: "splat",
              data: { key, to: destination },
            });
        }
      },
    };
  },
});
