import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, staticString, unwrap } from "../../lib/ast.ts";
import { callsVoid } from "../../lib/database.ts";
import { isEnvFile } from "../../lib/env.ts";
import { defineRule } from "../../rule.ts";

const SECRET_WORDS = /SECRET|TOKEN|PASSWORD|PRIVATE|KEY/;
const SECRET_DEFAULT = /KEY|SECRET|TOKEN|PASSWORD/;
// Names that say the value is meant to be public.
const PUBLIC_WORDS = /PUBLISHABLE|PUBLIC|ORIGIN/;

/** Docs: client values are public (`guide/env-vars.md:87`), defaults are not for credentials (`:34`). */
/** The helper a schema chain starts from: `url` for `url().optional().default(…)`, `string` for `z.string()`. */
function baseHelper(node: ESTree.Node): string | null {
  let current = node;
  while (current.type === "CallExpression") {
    const callee = current.callee;
    if (callee.type === "Identifier") return callee.name;
    if (callee.type !== "MemberExpression" || callee.computed) return null;
    if (callee.object.type !== "CallExpression")
      return callee.property.type === "Identifier" ? callee.property.name : null;
    current = callee.object;
  }
  return null;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep secrets out of VITE_ variables and .default(...) values in env.ts, and name client keys VITE_*, not PUBLIC_*.",
      norms: [
        "reference/env/3",
        "guide-core/env-vars/11",
        "edge-integrations/nodejs-bun-deno/7",
        "guide-core/env-vars/3",
        "edge-integrations/frameworks-astro/10",
      ],
      scope: "any",
    },
    messages: {
      secretClient:
        "`{{name}}` looks like a secret, but a `VITE_` name is embedded in browser JavaScript and is public. Drop the `VITE_` prefix and read it on the server, or rename it if it is not a secret. See guide/env-vars.md.",
      secretDefault:
        "`{{name}}` looks like a credential, and `.default(...)` is a source-code constant that ships with the app. Remove the default and set the value with `void secret put {{name}}`. See guide/env-vars.md.",
      publicPrefix:
        "`{{name}}` starts with `PUBLIC_`. Void marks client-exposed `void/env` keys with `VITE_`, even in Astro. Rename it to `VITE_{{rest}}`. See integrations/frameworks/astro.md.",
    },
    schema: [],
  },
  create(context) {
    const isEnv = isEnvFile(context);
    const bindings = importBindings(context.sourceCode.ast);
    return {
      MemberExpression(node) {
        // import.meta.env.VITE_<NAME>, in any file
        const object = node.object;
        if (
          node.computed ||
          node.property.type !== "Identifier" ||
          !node.property.name.startsWith("VITE_") ||
          object.type !== "MemberExpression" ||
          object.computed ||
          object.property.type !== "Identifier" ||
          object.property.name !== "env" ||
          object.object.type !== "MetaProperty"
        )
          return;
        const name = node.property.name;
        if (SECRET_WORDS.test(name) && !PUBLIC_WORDS.test(name))
          context.report({ node, messageId: "secretClient", data: { name } });
      },
      CallExpression(node) {
        if (!isEnv || !callsVoid(node, "defineEnv", ["void/env", "void"], bindings)) return;
        const schema = unwrap(node.arguments[0] ?? node);
        if (schema.type !== "ObjectExpression") return;
        for (const member of schema.properties) {
          if (member.type !== "Property" || member.computed) continue;
          const name =
            member.key.type === "Identifier" ? member.key.name : staticString(member.key as never);
          if (name === null) continue;
          if (name.startsWith("PUBLIC_"))
            context.report({
              node: member.key,
              messageId: "publicPrefix",
              data: { name, rest: name.slice("PUBLIC_".length) },
            });
          else if (name.startsWith("VITE_")) {
            if (SECRET_WORDS.test(name) && !PUBLIC_WORDS.test(name))
              context.report({ node: member.key, messageId: "secretClient", data: { name } });
          } else if (SECRET_DEFAULT.test(name) && !PUBLIC_WORDS.test(name)) {
            // A credential is a string. `url()`, `number()` and the other typed helpers say the
            // value is something else (`OAUTH_TOKEN_URL: url().default("https://…")` is an endpoint).
            const helper = baseHelper(unwrap(member.value));
            if (helper !== null && helper !== "string") continue;
            // walk down the call chain: z.string().optional().default("x")
            for (let chain = unwrap(member.value); chain.type === "CallExpression";) {
              const callee = chain.callee;
              if (callee.type !== "MemberExpression") break;
              if (
                !callee.computed &&
                callee.property.type === "Identifier" &&
                callee.property.name === "default"
              ) {
                const value = chain.arguments[0] ? staticString(chain.arguments[0] as never) : null;
                if (value)
                  context.report({ node: chain, messageId: "secretDefault", data: { name } });
                break;
              }
              chain = unwrap(callee.object);
            }
          }
        }
      },
    };
  },
});
