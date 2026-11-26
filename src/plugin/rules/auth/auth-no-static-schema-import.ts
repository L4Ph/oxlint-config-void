import { isAuthFile } from "../../lib/auth.ts";
import { locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const VOID_AUTH = new Set([
  "AuthUser",
  "AuthSession",
  "AuthState",
  "getUser",
  "getSession",
  "getAuth",
  "requireAuth",
]);

/**
 * guide/auth.md:248: a hook that needs `@auth-schema` loads it inside the hook, because "the
 * generated schema does not exist yet on a fresh clone"; reference/api/auth.md:152: in
 * `auth.ts` "using Void's inferred auth types or auth helper results there creates a circular
 * reference". `defineAuth` itself is imported from `void/auth` (reference/api/auth.md:15).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In auth.ts, do not import @auth-schema or Void's inferred auth types and helpers statically.",
      norms: ["guide-core/auth/31", "reference/auth/14"],
      scope: "void",
    },
    messages: {
      schema:
        "`@auth-schema` does not exist yet on a fresh clone, so `auth.ts` cannot import it at load time. Import it inside the hook that needs it: `const { userTable } = await import('@auth-schema')`. See guide/auth.md.",
      voidAuth:
        "`{{name}}` from `void/auth` is inferred from `auth.ts`, so using it here creates a circular reference. Use Better Auth's own `User` and `Session` types from `better-auth`, or let the hook infer its types. See reference/api/auth.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isAuthFile(locate(context))) return {};
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source === "@auth-schema") {
          const typeOnly =
            node.importKind === "type" ||
            (node.specifiers.length > 0 &&
              node.specifiers.every(
                (specifier) =>
                  specifier.type === "ImportSpecifier" && specifier.importKind === "type",
              ));
          if (!typeOnly) context.report({ node, messageId: "schema" });
        } else if (source === "void/auth") {
          for (const specifier of node.specifiers) {
            if (specifier.type !== "ImportSpecifier") continue;
            const name =
              specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : String(specifier.imported.value);
            if (VOID_AUTH.has(name))
              context.report({ node: specifier, messageId: "voidAuth", data: { name } });
          }
        }
      },
    };
  },
});
