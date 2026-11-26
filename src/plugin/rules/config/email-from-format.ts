import { at, configObject, isVoidConfig } from "../../lib/config.ts";
import { staticString } from "../../lib/ast.ts";
import { defineRule } from "../../rule.ts";

const ADDRESS = String.raw`[^\s@<>,;"]+@[^\s@<>,;"]+`;
const NAME = String.raw`(?:"[^"]*"|[^<>,;"]+)`;
const SENDER = new RegExp(`^(?:${ADDRESS}|${NAME}\\s*<${ADDRESS}>)$`);

/** `email.from` is "one address, optionally with a display name" (reference/config.md:182). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Make email.from one address, optionally written as `Name <address>`.",
      norms: ["reference/config/14", "services/domains/8"],
      scope: "void",
    },
    messages: {
      from: "`email.from` is '{{value}}', which is not one address. Write `noreply@mail.example.com` or `Acme <noreply@mail.example.com>`. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        const from = config === null ? null : at(config, "email.from");
        const value = from === null ? null : staticString(from.value);
        if (from === null || value === null || SENDER.test(value.trim())) return;
        context.report({ node: from.value, messageId: "from", data: { value } });
      },
    };
  },
});
