import type { VoidRule } from "../../rule.ts";
import awaitIsrRevalidate from "./await-isr-revalidate.ts";
import cRewriteUsage from "./c-rewrite-usage.ts";
import revalidateHeaderValue from "./revalidate-header-value.ts";
import routingFallbacksSpaIndex from "./routing-fallbacks-spa-index.ts";
import routingHeadersCacheScope from "./routing-headers-cache-scope.ts";
import routingHeadersShape from "./routing-headers-shape.ts";
import routingOptionValues from "./routing-option-values.ts";
import routingRedirectsShape from "./routing-redirects-shape.ts";
import routingRewritePaths from "./routing-rewrite-paths.ts";
import routingRulesOrder from "./routing-rules-order.ts";

export const rules: Record<string, VoidRule> = {
  "await-isr-revalidate": awaitIsrRevalidate,
  "c-rewrite-usage": cRewriteUsage,
  "revalidate-header-value": revalidateHeaderValue,
  "routing-fallbacks-spa-index": routingFallbacksSpaIndex,
  "routing-headers-cache-scope": routingHeadersCacheScope,
  "routing-headers-shape": routingHeadersShape,
  "routing-option-values": routingOptionValues,
  "routing-redirects-shape": routingRedirectsShape,
  "routing-rewrite-paths": routingRewritePaths,
  "routing-rules-order": routingRulesOrder,
};
