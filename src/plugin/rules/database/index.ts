import type { VoidRule } from "../../rule.ts";
import dbBatchNotEmpty from "./db-batch-not-empty.ts";
import dbBookmarkReturned from "./db-bookmark-returned.ts";
import dbSessionInRequestScope from "./db-session-in-request-scope.ts";
import setSessionUsage from "./set-session-usage.ts";

export const rules: Record<string, VoidRule> = {
  "db-batch-not-empty": dbBatchNotEmpty,
  "db-bookmark-returned": dbBookmarkReturned,
  "db-session-in-request-scope": dbSessionInRequestScope,
  "set-session-usage": setSessionUsage,
};
