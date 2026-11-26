import { staticString } from "../../lib/ast.ts";
import { arrayAt, at, configObject, isVoidConfig } from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const PROVIDERS = new Set(
  `email apple atlassian cognito discord dropbox facebook figma github gitlab google huggingface
   kakao kick line linear linkedin microsoft naver notion paybin paypal polar railway reddit roblox
   salesforce slack spotify tiktok twitch twitter vercel vk zoom`.split(/\s+/),
);
const TARGETS = ["cloudflare", "node", "bun", "deno"];
const HINTS = ["apac", "eeur", "enam", "weur", "wnam", "oc"];
const SIZES = ["lite", "basic", "standard-1", "standard-2", "standard-3", "standard-4"];

/**
 * Values the config reference lists: `auth.providers` (reference/config.md:93), `target`
 * (:285), `storage.locationHint` (:310), `sandbox.instanceType` (:279). A `platformImage` is
 * checked only where the docs rule it out: a Cloudflare registry reference without a digest,
 * or an external registry (reference/config.md:279, guide/sandboxes.md:130).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use only the documented values for auth.providers, target, storage.locationHint and the sandbox image settings.",
      norms: [
        "reference/config/9",
        "reference/config/25",
        "edge-integrations/nodejs-bun-deno/1",
        "reference/config/28",
        "reference/config/20",
        "reference/config/21",
        "services/sandboxes/18",
      ],
      scope: "void",
    },
    messages: {
      provider:
        "'{{value}}' is not an `auth.providers` value Void supports. Use one of the names listed in reference/config.md (for example 'email', 'github', 'google').",
      target:
        "`target: '{{value}}'` is not a deploy target. Use 'cloudflare', 'node', 'bun' or 'deno'. See reference/config.md.",
      locationHint:
        "`storage.locationHint: '{{value}}'` is not a supported hint. Use apac, eeur, enam, weur, wnam or oc. See reference/config.md.",
      instanceType:
        "`sandbox.instanceType: '{{value}}'` is not a supported size. Use lite, basic, or standard-1 to standard-4. See reference/config.md.",
      platformImage:
        "`sandbox.platformImage` '{{value}}' is not a digest-pinned Cloudflare registry reference. Push the image to the platform account's registry and use `registry.cloudflare.com/<account-id>/<image>@sha256:<digest>`. See guide/sandboxes.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const providers = arrayAt(config, "auth.providers");
        for (const element of providers?.elements ?? []) {
          if (element === null || element.type === "SpreadElement") continue;
          const value = staticString(element);
          if (value !== null && !PROVIDERS.has(value))
            context.report({ node: element, messageId: "provider", data: { value } });
        }
        const checks: [string, string[], "target" | "locationHint" | "instanceType"][] = [
          ["target", TARGETS, "target"],
          ["storage.locationHint", HINTS, "locationHint"],
          ["sandbox.instanceType", SIZES, "instanceType"],
        ];
        for (const [path, allowed, messageId] of checks) {
          const found = at(config, path);
          const value = found === null ? null : staticString(found.value);
          if (found !== null && value !== null && !allowed.includes(value))
            context.report({ node: found.value, messageId, data: { value } });
        }
        const image = at(config, "sandbox.platformImage");
        const reference = image === null ? null : staticString(image.value);
        if (image === null || reference === null) return;
        const registry = reference.startsWith("registry.cloudflare.com/");
        const external = /^[^/]*[.:][^/]*\//.test(reference) && !registry;
        if ((registry && !reference.includes("@sha256:")) || external)
          context.report({
            node: image.value,
            messageId: "platformImage",
            data: { value: reference },
          });
      },
    };
  },
});
