import { existsSync } from "node:fs";
import path from "node:path";

const CONFIG_FILES = ["void.config.ts", "void.config.mts", "void.config.js", "void.config.mjs"];

const roots = new Map<string, string | null>();

/**
 * The directory of the Void app a file belongs to: the nearest ancestor holding a
 * `void.config.*`, or else the nearest holding a `package.json`. Cached per directory,
 * because every rule asks for every file.
 */
function findRoot(dir: string): string | null {
  const cached = roots.get(dir);
  if (cached !== undefined) return cached;
  let byPackage: string | null = null;
  let found: string | null = null;
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

/** Where a file sits in its app, as Void's conventions see it. */
export type Location = {
  /** Relative to the app's source directory, with forward slashes. */
  path: string;
  segments: string[];
  /** The first segment (`pages`, `routes`, …); empty for a file at the top. */
  dir: string;
  /** The file name. */
  name: string;
};

type Located = { filename: string; cwd?: string; settings?: Record<string, unknown> };

/**
 * `settings.void.root` names the app's directory when it cannot be found from the file
 * (relative to the linter's working directory); `settings.void.sourceDir` is Void's own
 * `sourceDir` option, the directory the convention directories live under.
 */
export function locate(context: Located): Location | null {
  const settings = context.settings?.void as { root?: string; sourceDir?: string } | undefined;
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
    dir: segments.length > 1 ? (segments[0] ?? "") : "",
    name: segments[segments.length - 1] ?? "",
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
] as const;

/** True when a path segment below the convention directory starts with `_`: Void skips it. */
export function isPrivate(segments: string[]): boolean {
  return segments.slice(1).some((segment) => segment.startsWith("_"));
}

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/** A Vitest-style test file name. */
export function isTestFile(name: string): boolean {
  return TEST_FILE.test(name);
}

/** The settings a consumer may give under `settings.void` in the lint config. */
export type VoidSettings = {
  /** The app's directory, when it cannot be found from the file (relative to the working directory). */
  root?: string;
  /** Void's own `sourceDir` option. */
  sourceDir?: string;
};

const SERVER_COMPANION = /\.server\.(?:ts|tsx|js|jsx|mts|mjs)$/;
const PAGE_COMPONENT = /\.(?:tsx|jsx|vue|svelte|md)$/;
const ENV_SUFFIX = /\.(dev|prod)(?=\.)/;

/** What a file is to Void, read from where it sits and how it is named. */
export type FileKind = {
  /** The convention directory it is in, when it is in one. */
  convention: (typeof CONVENTION_DIRS)[number] | "db" | null;
  /** Skipped by Void's scan: a path segment below the convention directory starts with `_`. */
  private: boolean;
  /** A page's `.server.*` companion (in `pages/`). */
  serverCompanion: boolean;
  /** A page component, layout or boundary file (in `pages/`, not a companion). */
  pageComponent: boolean;
  /** Named `<name>.island.<ext>`. */
  island: boolean;
  /** Named `layout.*`, or a file of a `_layouts/` directory. */
  layout: boolean;
  /** Named `_error.*` or `_not-found.*`. */
  boundary: "error" | "not-found" | null;
  /** The `.dev` / `.prod` suffix. */
  environment: "dev" | "prod" | null;
  test: boolean;
};

/** Classifies a located file. `_layouts/` is the one `_` directory Void reads. */
export function describe(file: Location): FileKind {
  const convention =
    ([...CONVENTION_DIRS, "db"] as const).find((name) => name === file.dir) ?? null;
  const below = file.segments.slice(1);
  const inLayouts = below.slice(0, -1).includes("_layouts");
  const boundary = file.name.startsWith("_error.")
    ? "error"
    : file.name.startsWith("_not-found.")
      ? "not-found"
      : null;
  const hidden = below.some(
    (segment, index) =>
      segment.startsWith("_") &&
      segment !== "_layouts" &&
      !(index === below.length - 1 && boundary !== null),
  );
  const serverCompanion = convention === "pages" && SERVER_COMPANION.test(file.name);
  return {
    convention,
    private: hidden,
    serverCompanion,
    pageComponent: convention === "pages" && !serverCompanion && PAGE_COMPONENT.test(file.name),
    island: /\.island\.[^.]+$/.test(file.name),
    layout: file.name.startsWith("layout.") || inLayouts,
    boundary,
    environment: (ENV_SUFFIX.exec(file.name)?.[1] as "dev" | "prod" | undefined) ?? null,
    test: isTestFile(file.name),
  };
}
