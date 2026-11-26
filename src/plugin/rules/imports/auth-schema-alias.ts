import { moduleSpecifiers } from "../../lib/handlers.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/auth.md:142-185: Void's generated authentication schema is reached through the
 * `@auth-schema` alias; `.void/better-auth-schema.ts` is regenerated and is not to be edited
 * or imported by path.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Import Better Auth's generated tables from @auth-schema, not from .void/.",
      norms: ["guide-core/auth/13"],
      scope: "void",
    },
    messages: {
      path: '`{{specifier}}` reaches into `.void/`, which Void regenerates. Import the tables from the alias instead: `import { userTable } from \'@auth-schema\'` (add `"@auth-schema": ["./.void/better-auth-schema.ts"]` to `paths` in tsconfig.json). See guide/auth.md.',
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program)) {
          const specifier = String(node.value);
          if (specifier.includes(".void/better-auth-schema"))
            context.report({ node, messageId: "path", data: { specifier } });
        }
      },
    };
  },
});
