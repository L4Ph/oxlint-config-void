import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, property, staticString, unwrap } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;

/** Named by guide/email/sending.md: "(From, Date, etc.)" and the `threading` option. */
const RESERVED = new Set(["from", "date"]);
const THREADING = new Set(["in-reply-to", "references"]);
const MAX_RECIPIENTS = 50;

/** The values a recipient option spells out: its string literals and `{ email }` objects. */
function addresses(value: Node): { node: Node; text: string }[] {
  const node = unwrap(value);
  if (node.type === "ArrayExpression")
    return node.elements.flatMap((element) =>
      element === null || element.type === "SpreadElement" ? [] : addresses(element),
    );
  if (node.type === "ObjectExpression") {
    const email = property(node, "email");
    const text = email ? staticString(email.value) : null;
    return email && text !== null ? [{ node: email.value, text }] : [];
  }
  const text = staticString(node);
  return text === null ? [] : [{ node, text }];
}

/** The `sendEmail()` options that guide/email/sending.md fixes: required fields and limits. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give sendEmail() a to, a subject and a text or html, and keep its headers, key, recipients, addresses and attachments within the documented limits.",
      norms: [
        "services/sending/8",
        "services/sending/9",
        "services/sending/10",
        "services/sending/11",
        "services/sending/19",
        "services/sending/12",
        "services/sending/13",
        "services/sending/14",
        "services/sending/21",
        "services/sending/20",
      ],
      scope: "void",
    },
    messages: {
      missing:
        "`sendEmail()` requires {{what}}, and this call has none. Add it to the options. See guide/email/sending.md.",
      reservedHeader:
        "The `{{name}}` header is reserved and Void ignores it. Remove it from `headers` (set the sender with `from`). See guide/email/sending.md.",
      threadingHeader:
        "Do not set `{{name}}` in `headers`. Pass `threading: { inReplyTo, references }` instead; Void validates the IDs. See guide/email/sending.md.",
      idempotencyKey:
        "`idempotencyKey` must be 1-128 printable ASCII characters without spaces; this one {{problem}}. Use a key such as `invoice:42:ready`. See guide/email/sending.md.",
      recipients:
        "This call lists at least {{count}} recipients across `to`, `cc` and `bcc`; the limit is 50. Split the send. See guide/email/sending.md.",
      address:
        "The address '{{address}}' has non-ASCII characters. Use an ASCII local part and punycode for an internationalized domain (a display name may be Unicode). See guide/email/sending.md.",
      contentType:
        "'{{value}}' is not a media type. Write `type/subtype` such as 'application/pdf', or omit `contentType` and Void infers it from the filename. See guide/email/sending.md.",
      inline:
        "An inline attachment needs both `disposition: 'inline'` and a `contentId`; this one {{problem}}. See guide/email/sending.md.",
    },
    schema: [],
  },
  create(context) {
    const bindings = importBindings(context.sourceCode.ast);
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        const binding = bindings.get(node.callee.name);
        if (binding?.imported !== "sendEmail" || binding.source !== "void/email") return;
        const first = node.arguments[0];
        if (!first || first.type === "SpreadElement") return;
        const options = unwrap(first);
        if (options.type !== "ObjectExpression") return;
        const spread = options.properties.some((member) => member.type === "SpreadElement");

        if (!spread) {
          const missing = [
            property(options, "to") === null ? "a `to`" : null,
            property(options, "subject") === null ? "a `subject`" : null,
            property(options, "text") === null && property(options, "html") === null
              ? "`text` or `html`"
              : null,
          ].filter((what) => what !== null);
          for (const what of missing)
            context.report({ node: options, messageId: "missing", data: { what } });
        }

        const headers = property(options, "headers");
        const headerObject = headers ? unwrap(headers.value) : null;
        if (headerObject?.type === "ObjectExpression") {
          for (const member of headerObject.properties) {
            if (member.type !== "Property" || member.computed) continue;
            const name =
              member.key.type === "Identifier"
                ? member.key.name
                : member.key.type === "Literal" && typeof member.key.value === "string"
                  ? member.key.value
                  : null;
            if (name === null) continue;
            if (RESERVED.has(name.toLowerCase()))
              context.report({ node: member.key, messageId: "reservedHeader", data: { name } });
            else if (THREADING.has(name.toLowerCase()))
              context.report({ node: member.key, messageId: "threadingHeader", data: { name } });
          }
        }

        const key = property(options, "idempotencyKey");
        const keyText = key ? staticString(key.value) : null;
        if (key && keyText !== null) {
          const problem =
            keyText.length === 0
              ? "is empty"
              : keyText.length > 128
                ? `has ${keyText.length} characters`
                : /[^\x21-\x7e]/.test(keyText)
                  ? "contains a space or a non-ASCII character"
                  : null;
          if (problem)
            context.report({ node: key.value, messageId: "idempotencyKey", data: { problem } });
        }

        // A lower bound: spreads and values we cannot read count zero.
        let count = 0;
        for (const name of ["to", "cc", "bcc"]) {
          const member = property(options, name);
          if (member) count += addresses(member.value).length;
        }
        if (count > MAX_RECIPIENTS)
          context.report({
            node: options,
            messageId: "recipients",
            data: { count: String(count) },
          });

        for (const name of ["to", "cc", "bcc", "replyTo"]) {
          const member = property(options, name);
          if (!member) continue;
          for (const { node: at, text } of addresses(member.value)) {
            // "Name <a@b.dev>": a Unicode display name is supported; only the address is judged.
            const address = /<([^<>]*)>\s*$/.exec(text)?.[1] ?? text;
            if (/\P{ASCII}/u.test(address))
              context.report({ node: at, messageId: "address", data: { address } });
          }
        }

        const attachments = property(options, "attachments");
        const list = attachments ? unwrap(attachments.value) : null;
        if (list?.type !== "ArrayExpression") return;
        for (const element of list.elements) {
          const attachment = element && element.type !== "SpreadElement" ? unwrap(element) : null;
          if (attachment?.type !== "ObjectExpression") continue;
          const attachmentSpread = attachment.properties.some((m) => m.type === "SpreadElement");
          const type = property(attachment, "contentType");
          const typeText = type ? staticString(type.value) : null;
          if (type && typeText !== null && !/^[\w.+-]+\/[\w.+-]+/.test(typeText))
            context.report({
              node: type.value,
              messageId: "contentType",
              data: { value: typeText },
            });
          if (attachmentSpread) continue;
          const id = property(attachment, "contentId");
          const disposition = property(attachment, "disposition");
          const dispositionText = disposition ? staticString(disposition.value) : null;
          if (disposition && dispositionText === null) continue;
          if (id && dispositionText !== "inline")
            context.report({
              node: attachment,
              messageId: "inline",
              data: { problem: "has a `contentId` but no `disposition: 'inline'`" },
            });
          else if (!id && dispositionText === "inline")
            context.report({
              node: attachment,
              messageId: "inline",
              data: { problem: "has `disposition: 'inline'` but no `contentId`" },
            });
        }
      },
    };
  },
});
