import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OxlintConfig } from "vite-plus/lint";
import { rules } from "./plugin/index.ts";

// An absolute path, so the linter finds the plugin wherever the consumer's config lives.
// Built, this file is JavaScript beside the built plugin; in this repository it is TypeScript.
const here = fileURLToPath(import.meta.url);
const specifier = path.join(path.dirname(here), "plugin", `index${path.extname(here)}`);

/**
 * The preset: `extends: [voidConfig]` in an Oxlint config, or under `lint` in a Vite+
 * `vite.config.ts`. Every rule of the plugin is on, as an error.
 */
const config: OxlintConfig = {
  jsPlugins: [{ name: "void", specifier }],
  rules: Object.fromEntries(Object.keys(rules).map((name) => [`void/${name}`, "error"])),
};

export default config;
