import type { VoidRule } from "../../rule.ts";
import deferredUseInSuspense from "./deferred-use-in-suspense.ts";
import dynamicPrerenderNeedsPaths from "./dynamic-prerender-needs-paths.ts";
import errorBoundaryFiles from "./error-boundary-files.ts";
import getPrerenderPathsShape from "./get-prerender-paths-shape.ts";
import layoutRendersChildren from "./layout-renders-children.ts";
import linkPrefetchOptions from "./link-prefetch-options.ts";
import linkPropShape from "./link-prop-shape.ts";
import loaderReturnSerializable from "./loader-return-serializable.ts";
import loaderReturnsObject from "./loader-returns-object.ts";
import noEagerPrefetch from "./no-eager-prefetch.ts";
import noLocationNavigation from "./no-location-navigation.ts";
import noParamByNameInPageServer from "./no-param-by-name-in-page-server.ts";
import noSolidPropsDestructure from "./no-solid-props-destructure.ts";
import noStatusInDefer from "./no-status-in-defer.ts";
import pageIsrExports from "./page-isr-exports.ts";
import pageServerExportShape from "./page-server-export-shape.ts";
import serverExportsInServerFile from "./server-exports-in-server-file.ts";
import setPreservesShared from "./set-preserves-shared.ts";
import ssrEntryPrerenderPaths from "./ssr-entry-prerender-paths.ts";
import useParamsPatternTypeArg from "./use-params-pattern-type-arg.ts";
import viewTransitionsOptionName from "./view-transitions-option-name.ts";

export const rules: Record<string, VoidRule> = {
  "deferred-use-in-suspense": deferredUseInSuspense,
  "dynamic-prerender-needs-paths": dynamicPrerenderNeedsPaths,
  "error-boundary-files": errorBoundaryFiles,
  "get-prerender-paths-shape": getPrerenderPathsShape,
  "layout-renders-children": layoutRendersChildren,
  "link-prefetch-options": linkPrefetchOptions,
  "link-prop-shape": linkPropShape,
  "loader-return-serializable": loaderReturnSerializable,
  "loader-returns-object": loaderReturnsObject,
  "no-eager-prefetch": noEagerPrefetch,
  "no-location-navigation": noLocationNavigation,
  "no-param-by-name-in-page-server": noParamByNameInPageServer,
  "no-solid-props-destructure": noSolidPropsDestructure,
  "no-status-in-defer": noStatusInDefer,
  "page-isr-exports": pageIsrExports,
  "page-server-export-shape": pageServerExportShape,
  "server-exports-in-server-file": serverExportsInServerFile,
  "set-preserves-shared": setPreservesShared,
  "ssr-entry-prerender-paths": ssrEntryPrerenderPaths,
  "use-params-pattern-type-arg": useParamsPatternTypeArg,
  "view-transitions-option-name": viewTransitionsOptionName,
};
