import type { VoidRule } from "../../rule.ts";
import cronFilePlacement from "./cron-file-placement.ts";
import durableObjectClassPlacement from "./durable-object-class-placement.ts";
import envSuffixPlacement from "./env-suffix-placement.ts";
import noConventionsOutsideSourceDir from "./no-conventions-outside-source-dir.ts";
import noEnvFileCrossing from "./no-env-file-crossing.ts";
import noPublicImport from "./no-public-import.ts";
import queueFilePlacement from "./queue-file-placement.ts";
import routeFileName from "./route-file-name.ts";
import schemaFileLayout from "./schema-file-layout.ts";

export const rules: Record<string, VoidRule> = {
  "cron-file-placement": cronFilePlacement,
  "durable-object-class-placement": durableObjectClassPlacement,
  "env-suffix-placement": envSuffixPlacement,
  "no-conventions-outside-source-dir": noConventionsOutsideSourceDir,
  "no-env-file-crossing": noEnvFileCrossing,
  "no-public-import": noPublicImport,
  "queue-file-placement": queueFilePlacement,
  "route-file-name": routeFileName,
  "schema-file-layout": schemaFileLayout,
};
