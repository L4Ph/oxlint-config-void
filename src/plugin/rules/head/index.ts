import type { VoidRule } from "../../rule.ts";
import headDefaultsSpread from "./head-defaults-spread.ts";
import noBrowserApiInHead from "./no-browser-api-in-head.ts";
import titleTemplateValue from "./title-template-value.ts";

export const rules: Record<string, VoidRule> = {
  "head-defaults-spread": headDefaultsSpread,
  "no-browser-api-in-head": noBrowserApiInHead,
  "title-template-value": titleTemplateValue,
};
