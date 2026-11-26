import path from "node:path";
import { RESOURCES, runtimeImports } from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

const UNIVERSAL = /^\+(?:page|layout)\.[cm]?[jt]s$/;

/**
 * The SvelteKit page: Void's helpers go "in server load functions, actions, and API
 * routes", and `void/kv`, `void/storage` and `void/ai` in "server-side code". A `.svelte`
 * component and the universal `+page.ts` / `+layout.ts` run in the browser. `void/auth` is
 * the auth rule's, and `void/sandbox` is not on the SvelteKit page.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In SvelteKit, import void/db, void/kv, void/storage and void/ai in server files only, not in .svelte files or universal +page.ts / +layout.ts.",
      norms: [
        "edge-integrations/frameworks-sveltekit/6",
        "edge-integrations/frameworks-sveltekit/8",
      ],
      scope: "framework:sveltekit",
    },
    messages: {
      client:
        "`{{module}}` is imported in `{{name}}`, which runs in the browser. Move the call to `+page.server.ts`, `+layout.server.ts` or `+server.ts` and return the data from `load`. See integrations/frameworks/sveltekit.md.",
    },
    schema: [],
  },
  create(context) {
    const name = path.basename(context.filename);
    if (!name.endsWith(".svelte") && !UNIVERSAL.test(name)) return {};
    return {
      Program(program) {
        for (const statement of runtimeImports(program, RESOURCES))
          context.report({
            node: statement,
            messageId: "client",
            data: { module: String(statement.source.value), name },
          });
      },
    };
  },
});
