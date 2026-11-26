import type { VoidRule } from "../../rule.ts";
import authFileDefineAuth from "./auth-file-define-auth.ts";
import cronFileExports from "./cron-file-exports.ts";
import defineAuthSpreadDefaults from "./define-auth-spread-defaults.ts";
import durableStateModule from "./durable-state-module.ts";
import emailHandlerFile from "./email-handler-file.ts";
import envFileDefineEnv from "./env-file-define-env.ts";
import middlewareDefaultExport from "./middleware-default-export.ts";
import queueDefaultExport from "./queue-default-export.ts";
import queueOptions from "./queue-options.ts";
import renderIncludesAssetTags from "./render-includes-asset-tags.ts";
import routeHandlerDefineHandler from "./route-handler-define-handler.ts";
import routeHasHandlerExport from "./route-has-handler-export.ts";
import routeNoDefaultExport from "./route-no-default-export.ts";
import seedModuleExport from "./seed-module-export.ts";
import ssrEntryDefineRender from "./ssr-entry-define-render.ts";
import wsRouteFile from "./ws-route-file.ts";

export const rules: Record<string, VoidRule> = {
  "auth-file-define-auth": authFileDefineAuth,
  "cron-file-exports": cronFileExports,
  "define-auth-spread-defaults": defineAuthSpreadDefaults,
  "durable-state-module": durableStateModule,
  "email-handler-file": emailHandlerFile,
  "env-file-define-env": envFileDefineEnv,
  "middleware-default-export": middlewareDefaultExport,
  "queue-default-export": queueDefaultExport,
  "queue-options": queueOptions,
  "render-includes-asset-tags": renderIncludesAssetTags,
  "route-handler-define-handler": routeHandlerDefineHandler,
  "route-has-handler-export": routeHasHandlerExport,
  "route-no-default-export": routeNoDefaultExport,
  "seed-module-export": seedModuleExport,
  "ssr-entry-define-render": ssrEntryDefineRender,
  "ws-route-file": wsRouteFile,
};
