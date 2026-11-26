import type { VoidRule } from "../../rule.ts";
import analogMainFields from "./analog-main-fields.ts";
import analogVoidImportServerOnly from "./analog-void-import-server-only.ts";
import astroPrerenderFalse from "./astro-prerender-false.ts";
import frameworkCompatFlags from "./framework-compat-flags.ts";
import nitroConfig from "./nitro-config.ts";
import noCloudflareVitePluginWithVoid from "./no-cloudflare-vite-plugin-with-void.ts";
import noVoidAuthInFrameworkApps from "./no-void-auth-in-framework-apps.ts";
import nuxtCompatibilityDate from "./nuxt-compatibility-date.ts";
import nuxtNoVoidInClient from "./nuxt-no-void-in-client.ts";
import nuxtSchemaAlias from "./nuxt-schema-alias.ts";
import reactRouterVoidInLoadersOnly from "./react-router-void-in-loaders-only.ts";
import sveltekitNoVoidInClient from "./sveltekit-no-void-in-client.ts";
import tanstackVoidInServerFn from "./tanstack-void-in-server-fn.ts";
import voidPluginBeforeFrameworkPlugin from "./void-plugin-before-framework-plugin.ts";
import voidWranglerConfigPath from "./void-wrangler-config-path.ts";

export const rules: Record<string, VoidRule> = {
  "analog-main-fields": analogMainFields,
  "analog-void-import-server-only": analogVoidImportServerOnly,
  "astro-prerender-false": astroPrerenderFalse,
  "framework-compat-flags": frameworkCompatFlags,
  "nitro-config": nitroConfig,
  "no-cloudflare-vite-plugin-with-void": noCloudflareVitePluginWithVoid,
  "no-void-auth-in-framework-apps": noVoidAuthInFrameworkApps,
  "nuxt-compatibility-date": nuxtCompatibilityDate,
  "nuxt-no-void-in-client": nuxtNoVoidInClient,
  "nuxt-schema-alias": nuxtSchemaAlias,
  "react-router-void-in-loaders-only": reactRouterVoidInLoadersOnly,
  "sveltekit-no-void-in-client": sveltekitNoVoidInClient,
  "tanstack-void-in-server-fn": tanstackVoidInServerFn,
  "void-plugin-before-framework-plugin": voidPluginBeforeFrameworkPlugin,
  "void-wrangler-config-path": voidWranglerConfigPath,
};
