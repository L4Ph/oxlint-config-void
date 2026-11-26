import type { VoidRule } from "../../rule.ts";
import deployIdempotencyKey from "./deploy-idempotency-key.ts";
import noPlatformCredentialsInSource from "./no-platform-credentials-in-source.ts";

export const rules: Record<string, VoidRule> = {
  "deploy-idempotency-key": deployIdempotencyKey,
  "no-platform-credentials-in-source": noPlatformCredentialsInSource,
};
