/**
 * The import paths Void's documentation names as public (`publicModules` in
 * `norms/reference.json`; a test keeps the two equal).
 */
export const PUBLIC_MODULES: readonly string[] = [
  "@void/md",
  "@void/md/pages",
  "@void/md/plugin",
  "@void/md/theme-content.css",
  "@void/md/theme.css",
  "@void/react",
  "@void/react/plugin",
  "@void/solid",
  "@void/solid/plugin",
  "@void/svelte",
  "@void/svelte/plugin",
  "@void/vue",
  "@void/vue/plugin",
  "void",
  "void/ai",
  "void/auth",
  "void/client",
  "void/client/react",
  "void/client/solid",
  "void/client/svelte",
  "void/client/vue",
  "void/config",
  "void/database-provider",
  "void/db",
  "void/deploy",
  "void/drizzle-arktype",
  "void/drizzle-valibot",
  "void/drizzle-zod",
  "void/durable",
  "void/email",
  "void/email/testing",
  "void/env",
  "void/handler",
  "void/isr",
  "void/kv",
  "void/limits",
  "void/live",
  "void/live/client",
  "void/log",
  "void/nitro",
  "void/pages",
  "void/queues",
  "void/response",
  "void/routes",
  "void/sandbox",
  "void/schema-d1",
  "void/schema-mysql",
  "void/schema-pg",
  "void/seed",
  "void/sse",
  "void/sse/client",
  "void/storage",
  "void/sveltekit",
  "void/validator",
  "void/ws",
  "void/ws/server",
];

/** Void's own entry points: `void`, `void/<x>` and the `@void/*` adapter packages. */
export function isVoidSpecifier(specifier: string): boolean {
  return specifier === "void" || specifier.startsWith("void/") || specifier.startsWith("@void/");
}

/** The server resources whose imports Void scans for (`reference/resource-inference.md`). */
export const RESOURCE_MODULES: readonly string[] = [
  "void/db",
  "void/kv",
  "void/storage",
  "void/ai",
  "void/auth",
  "void/sandbox",
  "void/queues",
  "void/live",
];
