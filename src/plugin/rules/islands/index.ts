import type { VoidRule } from "../../rule.ts";
import islandImportShape from "./island-import-shape.ts";
import islandNoRouter from "./island-no-router.ts";

export const rules: Record<string, VoidRule> = {
  "island-import-shape": islandImportShape,
  "island-no-router": islandNoRouter,
};
