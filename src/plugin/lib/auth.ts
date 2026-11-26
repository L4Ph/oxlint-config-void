import type { Location } from "./project.ts";

const AUTH_FILE = /^auth\.[cm]?[jt]s$/;

/** The app's root-level `auth.ts`, where `defineAuth(...)` customises Better Auth. */
export function isAuthFile(file: Location | null): boolean {
  return file !== null && file.segments.length === 1 && AUTH_FILE.test(file.name);
}
