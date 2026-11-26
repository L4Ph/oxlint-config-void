import type { VoidRule } from "../../rule.ts";
import adapterPackageImports from "./adapter-package-imports.ts";
import authImportsFromVoid from "./auth-imports-from-void.ts";
import authSchemaAlias from "./auth-schema-alias.ts";
import noCloudflareWorkersImport from "./no-cloudflare-workers-import.ts";
import noRedefineAuthTables from "./no-redefine-auth-tables.ts";
import noResourceImportInSfc from "./no-resource-import-in-sfc.ts";
import noUndocumentedVoidModule from "./no-undocumented-void-module.ts";
import resourceImportInScannedDir from "./resource-import-in-scanned-dir.ts";
import schemaImportAlias from "./schema-import-alias.ts";
import useVoidDrizzleModules from "./use-void-drizzle-modules.ts";
import voidDeployUsage from "./void-deploy-usage.ts";

export const rules: Record<string, VoidRule> = {
  "adapter-package-imports": adapterPackageImports,
  "auth-imports-from-void": authImportsFromVoid,
  "auth-schema-alias": authSchemaAlias,
  "no-cloudflare-workers-import": noCloudflareWorkersImport,
  "no-redefine-auth-tables": noRedefineAuthTables,
  "no-resource-import-in-sfc": noResourceImportInSfc,
  "no-undocumented-void-module": noUndocumentedVoidModule,
  "resource-import-in-scanned-dir": resourceImportInScannedDir,
  "schema-import-alias": schemaImportAlias,
  "use-void-drizzle-modules": useVoidDrizzleModules,
  "void-deploy-usage": voidDeployUsage,
};
