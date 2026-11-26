import type { VoidRule } from "./rule.ts";
import { rules as placement } from "./rules/placement/index.ts";
import { rules as conventionFiles } from "./rules/convention-files/index.ts";
import { rules as imports } from "./rules/imports/index.ts";
import { rules as serverClientBoundary } from "./rules/server-client-boundary/index.ts";
import { rules as handlers } from "./rules/handlers/index.ts";
import { rules as pages } from "./rules/pages/index.ts";
import { rules as formsActions } from "./rules/forms-actions/index.ts";
import { rules as head } from "./rules/head/index.ts";
import { rules as islands } from "./rules/islands/index.ts";
import { rules as markdown } from "./rules/markdown/index.ts";
import { rules as typedUrls } from "./rules/typed-urls/index.ts";
import { rules as typedFetch } from "./rules/typed-fetch/index.ts";
import { rules as auth } from "./rules/auth/index.ts";
import { rules as env } from "./rules/env/index.ts";
import { rules as database } from "./rules/database/index.ts";
import { rules as resources } from "./rules/resources/index.ts";
import { rules as realtime } from "./rules/realtime/index.ts";
import { rules as config } from "./rules/config/index.ts";
import { rules as edge } from "./rules/edge/index.ts";
import { rules as testing } from "./rules/testing/index.ts";
import { rules as frameworks } from "./rules/frameworks/index.ts";
import { rules as platform } from "./rules/platform/index.ts";

/** One rule per thing Void's documentation asks of an app that a lint can check, family by family. */
export const rules: Record<string, VoidRule> = {
  ...placement,
  ...conventionFiles,
  ...imports,
  ...serverClientBoundary,
  ...handlers,
  ...pages,
  ...formsActions,
  ...head,
  ...islands,
  ...markdown,
  ...typedUrls,
  ...typedFetch,
  ...auth,
  ...env,
  ...database,
  ...resources,
  ...realtime,
  ...config,
  ...edge,
  ...testing,
  ...frameworks,
  ...platform,
};

/** The `void` plugin. */
export default { meta: { name: "void" }, rules };
