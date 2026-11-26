import type { VoidRule } from "../../rule.ts";
import awaitVisitResolveOnData from "./await-visit-resolve-on-data.ts";
import handleActionResult from "./handle-action-result.ts";
import islandFormsUseIslandHook from "./island-forms-use-island-hook.ts";
import narrowActionError from "./narrow-action-error.ts";
import noFileMetadataAsKey from "./no-file-metadata-as-key.ts";
import noFocusInFormCallbacks from "./no-focus-in-form-callbacks.ts";
import preserveScrollPlacement from "./preserve-scroll-placement.ts";
import useFormParamsOption from "./use-form-params-option.ts";

export const rules: Record<string, VoidRule> = {
  "await-visit-resolve-on-data": awaitVisitResolveOnData,
  "handle-action-result": handleActionResult,
  "island-forms-use-island-hook": islandFormsUseIslandHook,
  "narrow-action-error": narrowActionError,
  "no-file-metadata-as-key": noFileMetadataAsKey,
  "no-focus-in-form-callbacks": noFocusInFormCallbacks,
  "preserve-scroll-placement": preserveScrollPlacement,
  "use-form-params-option": useFormParamsOption,
};
