import type { VoidRule } from "../../rule.ts";
import durableStateMigrations from "./durable-state-migrations.ts";
import durableStateReservedMethods from "./durable-state-reserved-methods.ts";
import eventSourceNoHeaders from "./event-source-no-headers.ts";
import eventStreamTextData from "./event-stream-text-data.ts";
import eventStreamUsage from "./event-stream-usage.ts";
import formatSseText from "./format-sse-text.ts";
import liveConnectClientImport from "./live-connect-client-import.ts";
import liveDistinctSubscriptionIds from "./live-distinct-subscription-ids.ts";
import liveRoutePair from "./live-route-pair.ts";
import liveStreamOptions from "./live-stream-options.ts";
import noBooleanReturnInGuardHooks from "./no-boolean-return-in-guard-hooks.ts";
import noGetRoomInOwnHooks from "./no-get-room-in-own-hooks.ts";
import roomActionDefinitions from "./room-action-definitions.ts";
import roomActionStructuredCloneArgs from "./room-action-structured-clone-args.ts";
import roomDefinitionOptions from "./room-definition-options.ts";
import wsCookieOriginCheck from "./ws-cookie-origin-check.ts";
import wsHookUsage from "./ws-hook-usage.ts";
import wsSendJsonOnly from "./ws-send-json-only.ts";

export const rules: Record<string, VoidRule> = {
  "durable-state-migrations": durableStateMigrations,
  "durable-state-reserved-methods": durableStateReservedMethods,
  "event-source-no-headers": eventSourceNoHeaders,
  "event-stream-text-data": eventStreamTextData,
  "event-stream-usage": eventStreamUsage,
  "format-sse-text": formatSseText,
  "live-connect-client-import": liveConnectClientImport,
  "live-distinct-subscription-ids": liveDistinctSubscriptionIds,
  "live-route-pair": liveRoutePair,
  "live-stream-options": liveStreamOptions,
  "no-boolean-return-in-guard-hooks": noBooleanReturnInGuardHooks,
  "no-get-room-in-own-hooks": noGetRoomInOwnHooks,
  "room-action-definitions": roomActionDefinitions,
  "room-action-structured-clone-args": roomActionStructuredCloneArgs,
  "room-definition-options": roomDefinitionOptions,
  "ws-cookie-origin-check": wsCookieOriginCheck,
  "ws-hook-usage": wsHookUsage,
  "ws-send-json-only": wsSendJsonOnly,
};
