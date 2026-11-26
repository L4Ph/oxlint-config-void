import type { VoidRule } from "../../rule.ts";
import cloudContextAugmentationModule from "./cloud-context-augmentation-module.ts";
import linkHrefShape from "./link-href-shape.ts";
import noAnyCastUrl from "./no-any-cast-url.ts";
import noOpenRedirect from "./no-open-redirect.ts";
import noStreamUrlFragments from "./no-stream-url-fragments.ts";
import routeTypesFromVoidRoutes from "./route-types-from-void-routes.ts";
import routeUrlParamsShape from "./route-url-params-shape.ts";

export const rules: Record<string, VoidRule> = {
  "cloud-context-augmentation-module": cloudContextAugmentationModule,
  "link-href-shape": linkHrefShape,
  "no-any-cast-url": noAnyCastUrl,
  "no-open-redirect": noOpenRedirect,
  "no-stream-url-fragments": noStreamUrlFragments,
  "route-types-from-void-routes": routeTypesFromVoidRoutes,
  "route-url-params-shape": routeUrlParamsShape,
};
