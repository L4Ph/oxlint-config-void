import { defineConfig } from "vite-plus";

export default defineConfig({
  // The preset and the plugin are separate files on disk: the preset hands the linter the plugin's path.
  pack: { entry: ["src/index.ts", "src/plugin/index.ts"], format: ["esm"], dts: true },
  test: { include: ["test/**/*.test.ts"] },
  // The catalog and the plans are data written by tools; their layout is not prose to format.
  fmt: { ignorePatterns: ["norms/**", "rules/plan.json", "skills/**", "docs/rules.md"] },
  lint: { options: { typeAware: true, typeCheck: true } },
});
