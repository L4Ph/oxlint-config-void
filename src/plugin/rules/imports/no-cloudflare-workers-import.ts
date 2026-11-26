import { moduleSpecifiers, nearestPackage } from "../../lib/handlers.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/** Frameworks that import bindings from `cloudflare:workers` themselves (integrations/cloudflare.md:20). */
const OWN_BINDINGS = ["@tanstack/react-start", "@tanstack/solid-start", "react-router", "astro"];

/**
 * integrations/cloudflare.md:12: "In Void routes and middleware, use `c.env`";
 * guide/database/d1.md:369: Nuxt and SvelteKit 2 do not support `cloudflare:workers` imports
 * during local development.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Reach bindings through c.env or the void/* clients in routes and middleware, and never import cloudflare:workers in Nuxt or SvelteKit 2.",
      norms: ["edge-integrations/cloudflare/1", "services/d1/31"],
      scope: "any",
    },
    messages: {
      routes:
        "Routes and middleware get bindings from `c.env` (`c.env.DB`) or from the `void/*` clients (`import { db } from 'void/db'`), not from `cloudflare:workers`. See integrations/cloudflare.md.",
      framework:
        "{{framework}} does not support `cloudflare:workers` imports during local development. Use `void/db` or your framework's binding access API. See guide/database/d1.md.",
    },
    schema: [],
  },
  create(context) {
    const settings = (context.settings?.void ?? {}) as { framework?: string };
    const pkg = nearestPackage(context);
    let framework: string | null = null;
    if (settings.framework === "nuxt" || pkg?.dependencies.has("nuxt")) framework = "Nuxt";
    else if (
      settings.framework === "sveltekit" ||
      /^[\^~>=\s]*2\b/.test(pkg?.ranges.get("@sveltejs/kit") ?? "")
    )
      framework = "SvelteKit 2";
    const file = locate(context);
    const kind = file ? describe(file) : null;
    const nativeRoute =
      kind !== null &&
      !kind.private &&
      !kind.test &&
      (kind.convention === "routes" || kind.convention === "middleware") &&
      !OWN_BINDINGS.some((name) => pkg?.dependencies.has(name));
    if (framework === null && !nativeRoute) return {};
    return {
      Program(program) {
        for (const node of moduleSpecifiers(program)) {
          if (node.value !== "cloudflare:workers") continue;
          if (framework !== null)
            context.report({ node, messageId: "framework", data: { framework } });
          else context.report({ node, messageId: "routes" });
        }
      },
    };
  },
});
