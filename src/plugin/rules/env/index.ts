import type { VoidRule } from "../../rule.ts";
import envSchemaSafeKeys from "./env-schema-safe-keys.ts";
import noAliasImportInConfigFiles from "./no-alias-import-in-config-files.ts";

export const rules: Record<string, VoidRule> = {
  "env-schema-safe-keys": envSchemaSafeKeys,
  "no-alias-import-in-config-files": noAliasImportInConfigFiles,
};
