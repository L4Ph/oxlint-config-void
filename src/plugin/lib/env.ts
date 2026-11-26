import { locate } from "./project.ts";

/** True for `env.ts` (any script extension) at the top of the app. */
export function isEnvFile(context: Parameters<typeof locate>[0]): boolean {
  const file = locate(context);
  return file !== null && file.segments.length === 1 && /^env\.[cm]?[jt]s$/.test(file.name);
}

/** True for `void.config.*` at the top of the app. */
export function isConfigFile(context: Parameters<typeof locate>[0]): boolean {
  const file = locate(context);
  return (
    file !== null && file.segments.length === 1 && /^void\.config\.[cm]?[jt]s$/.test(file.name)
  );
}
