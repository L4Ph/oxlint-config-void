import type { ESTree } from "vite-plus/lint/plugins";
import {
  importBindings,
  property,
  type ImportBinding,
  staticString,
  unwrap,
} from "../../lib/ast.ts";
import {
  configObject,
  hasSpread,
  importedCall,
  isConfigFile,
  optionsOf,
  pluginCalls,
} from "../../lib/frameworks.ts";
import { defineRule } from "../../rule.ts";

const WANTED = ".void-wrangler.jsonc";

type Found = { state: "ok" | "unknown" } | { state: "bad"; node: ESTree.Node };

/** Follows `segments` through nested object literals; reports where the path breaks or goes wrong. */
function follow(root: ESTree.ObjectExpression, segments: string[]): Found {
  let current: ESTree.ObjectExpression = root;
  for (const [index, segment] of segments.entries()) {
    const member = property(current, segment);
    if (!member) return hasSpread(current) ? { state: "unknown" } : { state: "bad", node: current };
    const value = unwrap(member.value);
    if (index === segments.length - 1) {
      const text = staticString(value);
      if (text === null) return { state: "unknown" };
      return text.replace(/^\.\//, "") === WANTED ? { state: "ok" } : { state: "bad", node: value };
    }
    if (value.type !== "ObjectExpression") return { state: "unknown" };
    current = value;
  }
  return { state: "unknown" };
}

/**
 * Each framework page points its Cloudflare dev runtime at Void's generated
 * `./.void-wrangler.jsonc`: Nuxt `nitro.cloudflare.dev.configPath`, Analog
 * `nitro.cloudflareDev.configPath`, Astro `cloudflare({ configPath })`, SvelteKit
 * `adapter({ config, platformProxy: { configPath } })`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Point the framework's Cloudflare dev runtime at ./.void-wrangler.jsonc, as the setup page of each framework shows.",
      norms: [
        "edge-integrations/frameworks-analog/4",
        "edge-integrations/frameworks-nuxt/3",
        "edge-integrations/frameworks-astro/3",
        "edge-integrations/frameworks-sveltekit/2",
      ],
      scope: "framework:analog,astro,nuxt,sveltekit",
    },
    messages: {
      path: "`{{option}}` is missing or is not './.void-wrangler.jsonc', the Cloudflare config Void generates. Set `{{option}}: './.void-wrangler.jsonc'`. See integrations/frameworks/{{page}}.md.",
    },
    schema: [],
  },
  create(context) {
    const nuxt = isConfigFile(context, "nuxt");
    const vite = isConfigFile(context, "vite");

    function check(
      owner: ESTree.ObjectExpression | null,
      anchor: ESTree.Node,
      segments: string[],
      option: string,
      page: string,
    ) {
      const found = owner ? follow(owner, segments) : ({ state: "bad", node: anchor } as const);
      if (found.state === "bad")
        context.report({ node: found.node, messageId: "path", data: { option, page } });
    }

    let bindings = new Map<string, ImportBinding>();
    return {
      Program(program) {
        bindings = importBindings(program);
        const config = configObject(program);
        if (nuxt && config)
          check(
            config,
            config,
            ["nitro", "cloudflare", "dev", "configPath"],
            "nitro.cloudflare.dev.configPath",
            "nuxt",
          );
        if (!vite || !config) return;
        for (const plugin of pluginCalls(config)) {
          const analog = importedCall(
            plugin,
            bindings,
            "default",
            (s) => s === "@analogjs/platform",
          );
          if (!analog) continue;
          const options = optionsOf(analog);
          if (analog.arguments.length > 0 && !options) continue;
          check(
            options,
            analog,
            ["nitro", "cloudflareDev", "configPath"],
            "nitro.cloudflareDev.configPath",
            "analog",
          );
        }
      },
      CallExpression(node) {
        const astro = importedCall(node, bindings, "default", (s) => s === "@astrojs/cloudflare");
        if (astro) {
          const options = optionsOf(astro);
          if (astro.arguments.length === 0 || options)
            check(options, astro, ["configPath"], "configPath", "astro");
          return;
        }
        const adapter = importedCall(
          node,
          bindings,
          "default",
          (s) => s === "@sveltejs/adapter-cloudflare",
        );
        if (!adapter) return;
        const options = optionsOf(adapter);
        if (adapter.arguments.length > 0 && !options) return;
        check(options, adapter, ["config"], "config", "sveltekit");
        check(
          options,
          adapter,
          ["platformProxy", "configPath"],
          "platformProxy.configPath",
          "sveltekit",
        );
      },
    };
  },
});
