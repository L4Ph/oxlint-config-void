import { importBindings } from "../../lib/ast.ts";
import { localNames, walk } from "../../lib/handlers.ts";
import { isVoidSpecifier } from "../../lib/imports.ts";
import { describe, isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const SERVER_HELPERS = new Set(["defineAuth", "getUser", "getSession", "getAuth", "requireAuth"]);
const AUTH_FILE = /^auth\.[cm]?[jt]s$/;

const isClient = (source: string) => source === "void/client" || source.startsWith("void/client/");

/**
 * reference/api/auth.md:8, guide/auth.md:22-134: the server helpers come from `void/auth`, the
 * `auth` client and `createAuthClient` from `void/client`, and Void builds the Better Auth
 * instance, so app code calls `getAuth(c)` instead of `betterAuth()`. The types `AuthUser` and
 * `AuthSession` replace Better Auth's `User` and `Session`, except in `auth.ts`, where
 * reference/api/auth.md:152 asks for Better Auth's own.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Take auth helpers from void/auth, the auth client from void/client, and build no Better Auth instance or client of your own.",
      norms: [
        "reference/auth/1",
        "reference/auth/15",
        "guide-core/auth/2",
        "guide-core/auth/8",
        "guide-core/auth/10",
        "guide-core/auth/9",
      ],
      scope: "void",
    },
    messages: {
      server:
        "`{{name}}` comes from `void/auth`, not `{{source}}`: `import { {{name}} } from 'void/auth'`. See reference/api/auth.md.",
      client:
        "`{{name}}` comes from `void/client`, not `{{source}}`: `import { {{name}} } from 'void/client'`. See guide/auth.md.",
      betterAuthClient:
        "Import `createAuthClient` from `void/client`, which re-exports Better Auth's and keeps the `/api/auth` base path: `import { createAuthClient } from 'void/client'`. See guide/auth.md.",
      instance:
        "Void builds the Better Auth instance. Configure it in `auth.ts` with `defineAuth(...)`, and call Better Auth from a handler with `getAuth(c).api`. See guide/auth.md.",
      types:
        "Use Void's `{{name}}` type here: `import type { Auth{{name}} } from 'void/auth'`, which includes the fields your plugins add. See guide/auth.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    const kind = file ? describe(file) : null;
    const isAuthFile = file !== null && file.segments.length === 1 && AUTH_FILE.test(file.name);
    const inApp = kind !== null && kind.convention !== null && !kind.private && !kind.test;
    return {
      Program(program) {
        if (isTestFile(context.filename.split("/").pop() ?? "")) return;
        for (const statement of program.body) {
          if (statement.type !== "ImportDeclaration") continue;
          const source = String(statement.source.value);
          for (const specifier of statement.specifiers) {
            if (specifier.type !== "ImportSpecifier") continue;
            const name =
              specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : String(specifier.imported.value);
            if (SERVER_HELPERS.has(name) && isVoidSpecifier(source) && source !== "void/auth")
              context.report({ node: specifier, messageId: "server", data: { name, source } });
            else if (name === "auth" && isVoidSpecifier(source) && !isClient(source))
              context.report({ node: specifier, messageId: "client", data: { name, source } });
            else if (
              name === "createAuthClient" &&
              (source.startsWith("better-auth/") || (isVoidSpecifier(source) && !isClient(source)))
            )
              context.report({ node: specifier, messageId: "betterAuthClient" });
            else if (
              (name === "User" || name === "Session") &&
              (source === "better-auth" || source === "better-auth/types") &&
              inApp &&
              !isAuthFile
            )
              context.report({ node: specifier, messageId: "types", data: { name } });
          }
        }
        const betterAuth = localNames(importBindings(program), "betterAuth", ["better-auth"]);
        if (betterAuth.size === 0) return;
        walk(program, (node) => {
          if (
            node.type === "CallExpression" &&
            node.callee.type === "Identifier" &&
            betterAuth.has(node.callee.name)
          )
            context.report({ node, messageId: "instance" });
        });
      },
    };
  },
});
