import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OxlintConfig } from "vite-plus/lint";
import { rules } from "./plugin/index.ts";

// An absolute path, so the linter finds the plugin wherever the consumer's config lives.
// Built, this file is JavaScript beside the built plugin; in this repository it is TypeScript.
const here = fileURLToPath(import.meta.url);
const specifier = path.join(path.dirname(here), "plugin", `index${path.extname(here)}`);

function preset(holds: (scope: string) => boolean): OxlintConfig {
  return {
    jsPlugins: [{ name: "void", specifier }],
    rules: Object.fromEntries(
      Object.entries(rules)
        .filter(([, rule]) => holds(rule.meta.docs.scope))
        .map(([name]) => [`void/${name}`, "error"]),
    ),
  };
}

const integrations = (scope: string) =>
  scope.startsWith("framework:") ? scope.slice("framework:".length).split(",") : [];

/**
 * The preset for a native Void app: `extends: [voidConfig]` in an Oxlint config, or under
 * `lint` in a Vite+ `vite.config.ts`. Every rule that holds for such an app is on, as an error.
 */
const config: OxlintConfig = preset((scope) => scope === "void" || scope === "any");

/**
 * The presets for apps that run a meta-framework on Void (`extends: [frameworks.nuxt]`):
 * the rules of that integration and the ones that hold for every Void app. The native
 * app's rules are left out; under a meta-framework the framework owns routing and pages.
 */
export const frameworks: Record<string, OxlintConfig> = Object.fromEntries(
  [...new Set(Object.values(rules).flatMap((rule) => integrations(rule.meta.docs.scope)))].map(
    (name) => [name, preset((scope) => scope === "any" || integrations(scope).includes(name))],
  ),
);

export default config;
