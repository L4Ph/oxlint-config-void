import type { ESTree } from "vite-plus/lint/plugins";
import { property, staticString, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

const HEADER = "x-void-deploy-idempotency-key";

/** The text a URL expression spells out, with `${}` holes as `\0`; null when it is not a literal, template or `+` chain. */
function urlText(node: ESTree.Node): string | null {
  const value = unwrap(node);
  if (value.type === "Literal") return typeof value.value === "string" ? value.value : null;
  if (value.type === "TemplateLiteral")
    return value.quasis.map((quasi) => quasi.value.cooked ?? "").join("\0");
  if (value.type === "BinaryExpression" && value.operator === "+") {
    // an operand that is not text (`id`) is a hole
    return (urlText(value.left) ?? "\0") + (urlText(value.right) ?? "\0");
  }
  return null;
}

/**
 * Narrower than the plan: the URL must contain `/projects/` as well as end in `/deploy`,
 * since the page names only `POST /projects/:id/deploy`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Send `x-void-deploy-idempotency-key` on a POST to `/projects/:id/deploy`.",
      norms: ["platform/connected-apps/18"],
      scope: "any",
    },
    messages: {
      key: "A POST to `/projects/:id/deploy` must carry `x-void-deploy-idempotency-key`, set to the `approval_id` of the publish. Add it to `headers`. See guide/platform/administration/connected-apps.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "fetch") return;
        const [url, init] = node.arguments;
        const text = url && url.type !== "SpreadElement" ? urlText(url) : null;
        if (text === null || !text.endsWith("/deploy") || !text.includes("/projects/")) return;
        const options = init && init.type !== "SpreadElement" ? unwrap(init) : null;
        if (!options || options.type !== "ObjectExpression") return;
        if (options.properties.some((member) => member.type !== "Property")) return; // spread: keys unknown
        const method = property(options, "method");
        if (!method || staticString(method.value)?.toUpperCase() !== "POST") return;
        const headers = property(options, "headers");
        const value = headers ? unwrap(headers.value) : null;
        if (headers && value?.type !== "ObjectExpression") return; // built elsewhere
        const object = value?.type === "ObjectExpression" ? value : null;
        if (object?.properties.some((member) => member.type !== "Property")) return;
        const present = object?.properties.some(
          (member) =>
            member.type === "Property" &&
            !member.computed &&
            String(
              member.key.type === "Identifier"
                ? member.key.name
                : (member.key as { value?: unknown }).value,
            ).toLowerCase() === HEADER,
        );
        if (!present) context.report({ node, messageId: "key" });
      },
    };
  },
});
