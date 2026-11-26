import type { VoidRule } from "../../rule.ts";
import clientFetchArguments from "./client-fetch-arguments.ts";
import clientFetchNoJsonCall from "./client-fetch-no-json-call.ts";
import useVoidClientFetch from "./use-void-client-fetch.ts";

export const rules: Record<string, VoidRule> = {
  "client-fetch-arguments": clientFetchArguments,
  "client-fetch-no-json-call": clientFetchNoJsonCall,
  "use-void-client-fetch": useVoidClientFetch,
};
