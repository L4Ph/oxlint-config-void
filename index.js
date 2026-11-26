import { fileURLToPath } from "node:url";
import plugin from "./plugin/index.js";

// An absolute path, so the linter finds the plugin wherever the consumer's config lives.
const specifier = fileURLToPath(new URL("./plugin/index.js", import.meta.url));

/** Every rule of the plugin, on. A rule is in the plugin only if Void's docs ask for what it checks. */
const rules = Object.fromEntries(Object.keys(plugin.rules).map((name) => [`void/${name}`, "error"]));

/**
 * The preset: `extends: [voidConfig]` in an Oxlint config, or under `lint` in a Vite+
 * `vite.config.ts`.
 * @satisfies {import("vite-plus/lint").OxlintConfig}
 */
const config = {
  jsPlugins: [{ name: "void", specifier }],
  rules,
};

export default config;
