import { staticString, unwrap } from "../../lib/ast.ts";
import { at, configObject, isVoidConfig, keyName, members, objectAt } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

/** Cloudflare Worker fields that belong to `cloudflare`, not to the top level or `worker`. */
const CLOUDFLARE_FIELDS = new Set([
  "d1_databases",
  "kv_namespaces",
  "r2_buckets",
  "services",
  "durable_objects",
  "queues",
  "routes",
  "route",
  "name",
  "account_id",
  "migrations",
  "vectorize",
  "hyperdrive",
]);
// `ai` is a field of defineConfig itself (reference/config.md:67); only `worker.ai` is misplaced.
const WORKER_ONLY_MISPLACED = new Set([...CLOUDFLARE_FIELDS, "ai"]);

/**
 * Binding arrays, `name`, `account_id`, routes, services and migrations go in `cloudflare`
 * (reference/config.md:316, :355; integrations/cloudflare.md:81); `deploy` is a Void setting
 * outside it (reference/config.md:381).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put Cloudflare settings under `cloudflare`, keep `deploy` at the top level, and use a valid deploy.cloudflare.mode.",
      norms: [
        "reference/config/30",
        "reference/config/36",
        "edge-integrations/cloudflare/6",
        "cli/deploy/22",
        "cli/domains/1",
        "reference/config/39",
        "reference/config/41",
      ],
      scope: "void",
    },
    messages: {
      misplaced:
        "`{{key}}` is a Cloudflare Worker field and sits {{where}}. Move it into `cloudflare: { ... }`. See reference/config.md.",
      environments:
        "`cloudflare.{{key}}` declares named environments, which a direct Cloudflare deploy does not support. Use the top-level `cloudflare` config for the one deployment. See reference/cli/deploy.md.",
      legacyRoute:
        "`cloudflare.route` is the legacy singular field. Write `routes: [...]` so `void domain add` cannot shadow it. See reference/cli/domains.md.",
      deployInside:
        "`deploy` is a Void setting and is not passed to Cloudflare. Move it out of `cloudflare` to the top level of defineConfig. See reference/config.md.",
      deployMode:
        "`deploy.cloudflare.mode` is '{{mode}}'. Use 'staged' (the default) or 'atomic'. See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        for (const member of members(config).props) {
          const key = keyName(member) ?? "";
          if (CLOUDFLARE_FIELDS.has(key))
            context.report({
              node: member,
              messageId: "misplaced",
              data: { key, where: "at the top level of defineConfig" },
            });
        }
        const worker = objectAt(config, "worker");
        if (worker !== null)
          for (const member of members(worker).props) {
            const key = keyName(member) ?? "";
            if (WORKER_ONLY_MISPLACED.has(key))
              context.report({
                node: member,
                messageId: "misplaced",
                data: { key, where: "under `worker`" },
              });
          }
        const cloudflare = objectAt(config, "cloudflare");
        if (cloudflare !== null)
          for (const member of members(cloudflare).props) {
            const key = keyName(member);
            if (key === "env" || key === "environments")
              context.report({ node: member, messageId: "environments", data: { key } });
            else if (key === "route") context.report({ node: member, messageId: "legacyRoute" });
            else if (key === "deploy") context.report({ node: member, messageId: "deployInside" });
          }
        const mode = at(config, "deploy.cloudflare.mode");
        const text = mode === null ? null : staticString(unwrap(mode.value));
        if (mode !== null && text !== null && text !== "staged" && text !== "atomic")
          context.report({ node: mode.value, messageId: "deployMode", data: { mode: text } });
      },
    };
  },
});
