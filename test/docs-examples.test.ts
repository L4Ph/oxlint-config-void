import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vite-plus/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsRoot = join(root, "node_modules/void/docs");

/**
 * The docs' own examples are correct code. A rule may never report something an example
 * writes. The entries below are the other kind of report, about something an example
 * leaves out, on examples that are fragments or are about another subject; each says why.
 */
const ABSENCES: Record<string, string> = {
  "typed-routes-enabled guide/database.md": "a config example about the database",
  "typed-routes-enabled guide/auth.md": "a config example about auth providers",
  "typed-routes-enabled guide/type-safety.md":
    "config examples about route patterns and prerender lists",
  "typed-routes-enabled reference/config.md": "config examples of single options",
  "typed-routes-enabled guide/pages-routing/head.md": "a config example about the head",
  "render-includes-asset-tags guide/typed-fetch.md":
    "an SSR entry shown to demonstrate fetch(), not rendering",
  "ssr-entry-define-render guide/edge/prerendering.md":
    "a fragment of the SSR entry showing only getPrerenderPaths",
};

const FENCE = /^```(\w+)([^\n]*)\n([\s\S]*?)^```/gm;
const PATH = String.raw`([\w.@\-\[\]()+/$]+\.(?:tsx?|jsx?|mts|mjs))`;

function markdown(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdown(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

it(
  "no rule reports what an example in the docs writes",
  { timeout: 120_000 },
  ({ onTestFinished }) => {
    const corpus = mkdtempSync(join(tmpdir(), "void-docs-examples-"));
    onTestFinished(() => rmSync(corpus, { force: true, recursive: true }));

    // Every code block that names its file goes into an app of its own, at that path.
    const origin = new Map<string, string>();
    let count = 0;
    for (const file of markdown(docsRoot)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(FENCE)) {
        const [, language = "", info = "", body = ""] = match;
        if (!["ts", "tsx", "js", "jsx", "mts", "mjs"].includes(language)) continue;
        const firstLine = body.split("\n", 1)[0] ?? "";
        const named =
          new RegExp(String.raw`^//\s*${PATH}`).exec(firstLine.trim())?.[1] ??
          new RegExp(String.raw`\[${PATH}\]`).exec(info)?.[1];
        if (!named || named.startsWith("/") || named.includes("..")) continue;
        const app = String(++count).padStart(4, "0");
        mkdirSync(dirname(join(corpus, app, named)), { recursive: true });
        writeFileSync(join(corpus, app, named), body);
        // `hono` is declared: the examples import it, and the docs tell the reader to add it.
        writeFileSync(
          join(corpus, app, "package.json"),
          JSON.stringify({
            name: "example",
            private: true,
            type: "module",
            dependencies: { hono: "*" },
          }),
        );
        origin.set(app, relative(docsRoot, file));
      }
    }
    expect(count).toBeGreaterThan(100);

    writeFileSync(join(corpus, "package.json"), JSON.stringify({ private: true, type: "module" }));
    writeFileSync(
      join(corpus, "vite.config.ts"),
      [
        `import voidConfig from ${JSON.stringify(join(root, "src/index.ts"))};`,
        `import { defineConfig } from ${JSON.stringify(join(root, "node_modules/vite-plus/dist/index.js"))};`,
        `export default defineConfig({ lint: { extends: [voidConfig], ignorePatterns: ["vite.config.ts"] } });`,
      ].join("\n"),
    );

    const run = spawnSync("vp", ["lint", "-f", "json"], { cwd: corpus, encoding: "utf8" });
    const diagnostics: { code?: string; filename: string; message: string }[] = JSON.parse(
      run.stdout,
    ).diagnostics;
    const reports = diagnostics
      .filter((diagnostic) => diagnostic.code?.startsWith("void("))
      .map((diagnostic) => {
        const rule = (diagnostic.code ?? "").slice("void(".length, -1);
        const [app = "", ...path] = diagnostic.filename.split("/");
        return {
          key: `${rule} ${origin.get(app)}`,
          at: `${origin.get(app)} ${path.join("/")}`,
          rule,
        };
      });

    expect(
      reports.filter((report) => !(report.key in ABSENCES)).map((r) => `${r.rule}: ${r.at}`),
    ).toEqual([]);
    // The plugin loaded and ran, and the list above holds nothing stale: each absence is still reported.
    const reported = new Set(reports.map((report) => report.key));
    expect(Object.keys(ABSENCES).filter((key) => !reported.has(key))).toEqual([]);
  },
);
