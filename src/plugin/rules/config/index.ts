import type { VoidRule } from "../../rule.ts";
import configAlwaysHttpsCloudflareOnly from "./config-always-https-cloudflare-only.ts";
import configCloudflarePlacement from "./config-cloudflare-placement.ts";
import configDatabaseOptions from "./config-database-options.ts";
import configEnumOptions from "./config-enum-options.ts";
import configFileDefineConfig from "./config-file-define-config.ts";
import configWorkerValues from "./config-worker-values.ts";
import emailFromFormat from "./email-from-format.ts";
import inferenceConfigValues from "./inference-config-values.ts";
import noDuplicateFrameworkPlugin from "./no-duplicate-framework-plugin.ts";
import noEmptyAssetsDir from "./no-empty-assets-dir.ts";
import pagesAdapterPluginPresent from "./pages-adapter-plugin-present.ts";
import prerenderSatisfiesRouteUrl from "./prerender-satisfies-route-url.ts";
import scandirsKeepDefaults from "./scandirs-keep-defaults.ts";
import typedRoutesEnabled from "./typed-routes-enabled.ts";
import voidPluginInViteConfig from "./void-plugin-in-vite-config.ts";
import voidPluginOptions from "./void-plugin-options.ts";
import voidPluginRootConfigOnly from "./void-plugin-root-config-only.ts";

export const rules: Record<string, VoidRule> = {
  "config-always-https-cloudflare-only": configAlwaysHttpsCloudflareOnly,
  "config-cloudflare-placement": configCloudflarePlacement,
  "config-database-options": configDatabaseOptions,
  "config-enum-options": configEnumOptions,
  "config-file-define-config": configFileDefineConfig,
  "config-worker-values": configWorkerValues,
  "email-from-format": emailFromFormat,
  "inference-config-values": inferenceConfigValues,
  "no-duplicate-framework-plugin": noDuplicateFrameworkPlugin,
  "no-empty-assets-dir": noEmptyAssetsDir,
  "pages-adapter-plugin-present": pagesAdapterPluginPresent,
  "prerender-satisfies-route-url": prerenderSatisfiesRouteUrl,
  "scandirs-keep-defaults": scandirsKeepDefaults,
  "typed-routes-enabled": typedRoutesEnabled,
  "void-plugin-in-vite-config": voidPluginInViteConfig,
  "void-plugin-options": voidPluginOptions,
  "void-plugin-root-config-only": voidPluginRootConfigOnly,
};
