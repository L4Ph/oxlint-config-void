import type { ESTree } from "vite-plus/lint/plugins";
import { isCallOf, type ImportBinding } from "./ast.ts";

type Node = ESTree.Node;

/** Where `defineHandler` and `defineMiddleware` come from. */
export const HANDLER_SOURCES = ["void", "void/handler"] as const;

/** A handler or middleware function, and the name it gives its context (`c`). */
export type HandlerFn = {
  name: string;
  fn: ESTree.Function | ESTree.ArrowFunctionExpression;
  middleware: boolean;
};

/**
 * The functions a `defineHandler(...)` or `defineMiddleware(...)` call (also the curried
 * `defineHandler.withValidator(...)(...)`) is given, with the name of their first parameter.
 */
export function handlerFunctions(
  call: ESTree.CallExpression,
  bindings: Map<string, ImportBinding>,
): HandlerFn[] {
  const middleware = isCallOf(call, "defineMiddleware", HANDLER_SOURCES, bindings);
  if (!middleware && !isCallOf(call, "defineHandler", HANDLER_SOURCES, bindings)) return [];
  const found: HandlerFn[] = [];
  for (const argument of call.arguments) {
    if (argument.type !== "ArrowFunctionExpression" && argument.type !== "FunctionExpression")
      continue;
    const first = argument.params[0];
    if (first?.type === "Identifier") found.push({ name: first.name, fn: argument, middleware });
  }
  return found;
}

/** True when `inner` lies inside `outer`, by source position. */
export function contains(outer: Node, inner: Node): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

/** Calls `visit` for every node below `node`, in source order. */
export function walk(node: Node, visit: (node: Node) => void): void {
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    for (const child of Array.isArray(value) ? value : [value])
      if (child !== null && typeof child === "object" && typeof child.type === "string")
        walk(child as Node, visit);
  }
}

/**
 * Whether the glob `pattern` matches `text`. As in Void's header, redirect, rewrite and
 * revalidate rules, `*` matches any characters including `/`.
 */
export function globMatches(pattern: string, text: string): boolean {
  const source = pattern
    .split("*")
    .map((part) => part.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`))
    .join(".*");
  return new RegExp(`^${source}$`, "s").test(text);
}

/**
 * The keys of a rule object that an earlier key already matches: with first-match-wins
 * rules they never apply. `*` in the later key stands for any text, so a later pattern is
 * shadowed when the earlier glob matches its own source text. Keys are compared only within
 * their kind (a path, or a host-prefixed `https://` source).
 */
export function shadowedKeys<T extends { key: string }>(entries: T[]): { entry: T; by: T }[] {
  const kind = (key: string) => (key.startsWith("https://") ? "host" : "path");
  const shadowed: { entry: T; by: T }[] = [];
  entries.forEach((entry, index) => {
    const by = entries
      .slice(0, index)
      .find(
        (earlier) => kind(earlier.key) === kind(entry.key) && globMatches(earlier.key, entry.key),
      );
    if (by !== undefined) shadowed.push({ entry, by });
  });
  return shadowed;
}
