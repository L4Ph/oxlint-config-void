import { existsSync } from "node:fs";
import path from "node:path";

const CONFIG_FILES = ["void.config.ts", "void.config.mts", "void.config.js", "void.config.mjs"];

/** @type {Map<string, string | null>} */
const roots = new Map();

/**
 * The directory of the Void app a file belongs to: the nearest ancestor holding a
 * `void.config.*`, or else the nearest holding a `package.json`. Cached per directory,
 * because every rule asks for every file.
 * @param {string} dir absolute
 * @returns {string | null}
 */
function findRoot(dir) {
  const cached = roots.get(dir);
  if (cached !== undefined) return cached;
  let byPackage = null;
  let found = null;
  for (let current = dir; ; current = path.dirname(current)) {
    if (CONFIG_FILES.some((name) => existsSync(path.join(current, name)))) {
      found = current;
      break;
    }
    if (byPackage === null && existsSync(path.join(current, "package.json"))) byPackage = current;
    if (path.dirname(current) === current) break;
  }
  const root = found ?? byPackage;
  roots.set(dir, root);
  return root;
}

/**
 * Where a file sits in its app, as Void's conventions see it.
 *
 * `settings.void.root` names the app's directory when it cannot be found from the file
 * (relative to the linter's working directory); `settings.void.sourceDir` is Void's own
 * `sourceDir` option, the directory the convention directories live under.
 *
 * @param {{ filename: string, cwd?: string, settings?: Record<string, unknown> }} context
 * @returns {{ path: string, segments: string[], dir: string, name: string } | null}
 *   `path` is relative to the app's source directory with forward slashes, `dir` its first
 *   segment (`pages`, `routes`, …; empty for a file at the top), `name` the file name.
 */
export function locate(context) {
  const settings = /** @type {{ root?: string, sourceDir?: string } | undefined} */ (
    context.settings?.void
  );
  const cwd = context.cwd ?? process.cwd();
  const filename = path.resolve(cwd, context.filename);
  const root = settings?.root ? path.resolve(cwd, settings.root) : findRoot(path.dirname(filename));
  if (root === null) return null;
  const base = settings?.sourceDir ? path.join(root, settings.sourceDir) : root;
  const relative = path.relative(base, filename);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  const segments = relative.split(path.sep);
  return {
    path: segments.join("/"),
    segments,
    dir: segments.length > 1 ? segments[0] : "",
    name: segments[segments.length - 1],
  };
}

/** Directories whose files Void turns into routes, pages, handlers or resources by where they sit. */
export const CONVENTION_DIRS = [
  "routes",
  "pages",
  "middleware",
  "crons",
  "queues",
  "email",
  "durable-objects",
];

/** True when a path segment below the convention directory starts with `_`: Void skips it. */
export function isPrivate(segments) {
  return segments.slice(1).some((segment) => segment.startsWith("_"));
}

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** A Vitest-style test file name. */
export function isTestFile(name) {
  return TEST_FILE.test(name);
}
