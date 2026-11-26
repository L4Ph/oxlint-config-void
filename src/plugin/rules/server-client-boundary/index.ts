import type { VoidRule } from "../../rule.ts";
import noServerModuleInBrowser from "./no-server-module-in-browser.ts";
import noServerSecretInBrowser from "./no-server-secret-in-browser.ts";
import noSseClientInServer from "./no-sse-client-in-server.ts";
import noValueImportFromServerFile from "./no-value-import-from-server-file.ts";

export const rules: Record<string, VoidRule> = {
  "no-server-module-in-browser": noServerModuleInBrowser,
  "no-server-secret-in-browser": noServerSecretInBrowser,
  "no-sse-client-in-server": noSseClientInServer,
  "no-value-import-from-server-file": noValueImportFromServerFile,
};
