import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { isTestFile } from "./project.ts";

/** A Vitest-style test file, judged by its name alone. */
export function isTestPath(filename: string): boolean {
  return isTestFile(path.basename(filename));
}

const cache = new Map<string, boolean>();

/** True when the nearest `package.json` above `filename` lists `vite-plus`. */
export function usesVitePlus(filename: string, cwd: string): boolean {
  for (let dir = path.dirname(path.resolve(cwd, filename)); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (existsSync(manifest)) {
      const cached = cache.get(manifest);
      if (cached !== undefined) return cached;
      let result = false;
      try {
        const json = JSON.parse(readFileSync(manifest, "utf8")) as Record<string, unknown>;
        result = ["dependencies", "devDependencies"].some((key) => {
          const deps = json[key];
          return typeof deps === "object" && deps !== null && "vite-plus" in deps;
        });
      } catch {
        // an unreadable manifest says nothing; stay silent
      }
      cache.set(manifest, result);
      return result;
    }
    if (path.dirname(dir) === dir) return false;
  }
}
