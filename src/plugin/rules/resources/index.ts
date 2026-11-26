import type { VoidRule } from "../../rule.ts";
import aiGatewayOptionsThirdArg from "./ai-gateway-options-third-arg.ts";
import aiStreamReturned from "./ai-stream-returned.ts";
import backgroundUsageLimitHandled from "./background-usage-limit-handled.ts";
import fetchStreamCaught from "./fetch-stream-caught.ts";
import inboundEmailUsage from "./inbound-email-usage.ts";
import kvPutArguments from "./kv-put-arguments.ts";
import loggingUsage from "./logging-usage.ts";
import noComputedEnvBinding from "./no-computed-env-binding.ts";
import noSendInDev from "./no-send-in-dev.ts";
import queueNoSwallowedError from "./queue-no-swallowed-error.ts";
import sandboxCallShape from "./sandbox-call-shape.ts";
import sandboxGetOptions from "./sandbox-get-options.ts";
import sandboxOutputDecoded from "./sandbox-output-decoded.ts";
import sendEmailIdempotencyInRetries from "./send-email-idempotency-in-retries.ts";
import sendEmailOptions from "./send-email-options.ts";
import sendEmailResultChecked from "./send-email-result-checked.ts";
import servedUploadNosniff from "./served-upload-nosniff.ts";
import usageLimitHandling from "./usage-limit-handling.ts";

export const rules: Record<string, VoidRule> = {
  "ai-gateway-options-third-arg": aiGatewayOptionsThirdArg,
  "ai-stream-returned": aiStreamReturned,
  "background-usage-limit-handled": backgroundUsageLimitHandled,
  "fetch-stream-caught": fetchStreamCaught,
  "inbound-email-usage": inboundEmailUsage,
  "kv-put-arguments": kvPutArguments,
  "logging-usage": loggingUsage,
  "no-computed-env-binding": noComputedEnvBinding,
  "no-send-in-dev": noSendInDev,
  "queue-no-swallowed-error": queueNoSwallowedError,
  "sandbox-call-shape": sandboxCallShape,
  "sandbox-get-options": sandboxGetOptions,
  "sandbox-output-decoded": sandboxOutputDecoded,
  "send-email-idempotency-in-retries": sendEmailIdempotencyInRetries,
  "send-email-options": sendEmailOptions,
  "send-email-result-checked": sendEmailResultChecked,
  "served-upload-nosniff": servedUploadNosniff,
  "usage-limit-handling": usageLimitHandling,
};
