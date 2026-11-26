import type { VoidRule } from "../../rule.ts";
import basicAuthCredentialsLazyEnv from "./basic-auth-credentials-lazy-env.ts";
import defineHandlerMaxMiddleware from "./define-handler-max-middleware.ts";
import honoCachePlacement from "./hono-cache-placement.ts";
import honoDeclaredDependency from "./hono-declared-dependency.ts";
import honoMiddlewareBeforeHandler from "./hono-middleware-before-handler.ts";
import httpExceptionShape from "./http-exception-shape.ts";
import redirectAfterMutation303 from "./redirect-after-mutation-303.ts";
import routeHtmlReactRender from "./route-html-react-render.ts";
import withValidatorShape from "./with-validator-shape.ts";

export const rules: Record<string, VoidRule> = {
  "basic-auth-credentials-lazy-env": basicAuthCredentialsLazyEnv,
  "define-handler-max-middleware": defineHandlerMaxMiddleware,
  "hono-cache-placement": honoCachePlacement,
  "hono-declared-dependency": honoDeclaredDependency,
  "hono-middleware-before-handler": honoMiddlewareBeforeHandler,
  "http-exception-shape": httpExceptionShape,
  "redirect-after-mutation-303": redirectAfterMutation303,
  "route-html-react-render": routeHtmlReactRender,
  "with-validator-shape": withValidatorShape,
};
