import { runtimeImports } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

const CLIENTS = [
  "void/client",
  "void/client/react",
  "void/client/vue",
  "void/client/svelte",
  "void/client/solid",
];

/**
 * Every framework page and the overview say it: "Void-managed auth is not supported in
 * framework mode yet", and name Better Auth's own integration instead. Void-managed auth
 * is `void/auth` and the `auth` client of `void/client` (reference/resource-inference.md).
 * A root `auth.ts` calling `defineAuth` imports it from `void/auth`, so that import is the
 * report.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not use Void-managed auth (void/auth, the auth client of void/client) in a meta-framework app.",
      norms: [
        "edge-integrations/frameworks-overview/3",
        "edge-integrations/frameworks-analog/8",
        "edge-integrations/frameworks-astro/6",
        "edge-integrations/frameworks-nuxt/11",
        "edge-integrations/frameworks-react-router/4",
        "edge-integrations/frameworks-sveltekit/7",
        "edge-integrations/frameworks-tanstack-start/4",
      ],
      scope: "framework:analog,astro,nuxt,react-router,sveltekit,tanstack-start",
    },
    messages: {
      auth: "`{{module}}` is Void-managed auth, which a meta-framework app does not support yet. Use Better Auth's official integration for your framework instead. See integrations/frameworks/overview.md.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        for (const statement of runtimeImports(program, ["void/auth", ...CLIENTS])) {
          const module = String(statement.source.value);
          const usesAuthClient = statement.specifiers.some(
            (specifier) =>
              specifier.type === "ImportSpecifier" &&
              specifier.imported.type === "Identifier" &&
              specifier.imported.name === "auth",
          );
          if (module === "void/auth" || usesAuthClient)
            context.report({ node: statement, messageId: "auth", data: { module } });
        }
      },
    };
  },
});
